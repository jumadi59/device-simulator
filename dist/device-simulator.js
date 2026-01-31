"use strict";
/* device-simulator.ts
 * Simulator Device Agent sesuai kontrak backend:
 * - subscribe: mdm/{serial}
 * - publish result: terminal/info
 *
 * npm i mqtt yargs zod
 * npx ts-node device-simulator.ts --serial SN-TEST-0001 --url mqtt://localhost:1883
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = __importDefault(require("mqtt"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PublishMessageSchema = zod_1.z.object({
    job: zod_1.z.string().nullable().optional(),
    correlationId: zod_1.z.string().nullable().optional(),
    payload: zod_1.z.unknown().nullable().optional(),
    status: zod_1.z.string().nullable().optional(),
    serialNumber: zod_1.z.string().nullable().optional(),
});
const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .option("url", { type: "string", default: process.env.MQTT_URL ?? "mqtt://localhost:1883" })
    .option("username", { type: "string", default: process.env.MQTT_USER })
    .option("password", { type: "string", default: process.env.MQTT_PASS })
    .option("serial", { type: "string", demandOption: true })
    .option("ackDelayMs", { type: "number", default: Number(process.env.ACK_DELAY_MS ?? 80) })
    .option("execDelayMs", { type: "number", default: Number(process.env.EXEC_DELAY_MS ?? 900) })
    .option("mode", {
    type: "string",
    default: process.env.SIM_MODE ?? "normal",
    choices: ["normal", "always_fail", "random_fail", "no_result", "slow_exec"],
})
    .option("randomFailRate", { type: "number", default: Number(process.env.RANDOM_FAIL_RATE ?? 0.1) })
    .strict()
    .parseSync();
const serial = argv.serial;
const topicCmd = `mdm/${serial}`;
const topicResult = `terminal/info`;
function nowIso() {
    return new Date().toISOString();
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function publishJson(client, topic, body) {
    client.publish(topic, JSON.stringify(body), { qos: 1 }, (err) => {
        if (err)
            console.error("[sim] publish error", err);
    });
}
async function execute(job, payload) {
    switch (job) {
        case "play_sound": {
            const p = payload ?? {};
            const count = typeof p?.count === "number" ? p.count : 1;
            if (count < 1 || count > 10)
                return { ok: false, err: "count must be 1..10" };
            return { ok: true, out: { played: count } };
        }
        case "get_terminal_info": {
            return {
                ok: true,
                out: { serial_number: serial, battery: 0.72, ts: nowIso() },
            };
        }
        case "reboot": {
            return { ok: true };
        }
        default:
            return { ok: false, err: `unknown job: ${job}` };
    }
}
const client = mqtt_1.default.connect(argv.url, {
    username: argv.username,
    password: argv.password,
    keepalive: 30,
    reconnectPeriod: 1000,
});
client.on("connect", () => {
    console.log("[sim] connected", { url: argv.url, serial });
    client.subscribe(topicCmd, { qos: 1 }, (err) => {
        if (err)
            console.error("[sim] subscribe error", err);
        else
            console.log("[sim] subscribed", topicCmd);
    });
});
client.on("error", (e) => console.error("[sim] mqtt error", e));
client.on("message", async (_t, buf) => {
    const raw = (() => {
        try {
            return JSON.parse(buf.toString("utf-8"));
        }
        catch {
            return null;
        }
    })();
    const parsed = PublishMessageSchema.safeParse(raw);
    if (!parsed.success) {
        console.warn("[sim] invalid message", parsed.error.issues, raw);
        return;
    }
    const msg = parsed.data;
    const job = msg.job ?? "";
    const correlationId = msg.correlationId ?? "";
    const payload = msg.payload ?? null;
    if (!job || !correlationId) {
        console.warn("[sim] missing job/correlationId", msg);
        return;
    }
    console.log("[sim] received", { topic: topicCmd, job, correlationId });
    // Mode: simulate offline / ignore result
    if (argv.mode === "no_result") {
        console.log("[sim] mode=no_result -> only ACKED, no final result");
    }
    // 1) ACKED
    await sleep(argv.ackDelayMs);
    const ack = {
        job,
        correlationId,
        payload: null,
        status: "ACKED",
        serialNumber: serial,
    };
    publishJson(client, topicResult, ack);
    console.log("[sim] published ACKED", ack);
    // If no_result, stop here
    if (argv.mode === "no_result")
        return;
    // 2) Execute (delay)
    const execDelay = argv.mode === "slow_exec" ? Math.max(argv.execDelayMs, 8000) : argv.execDelayMs;
    await sleep(execDelay);
    const shouldFail = argv.mode === "always_fail" ||
        (argv.mode === "random_fail" && Math.random() < argv.randomFailRate);
    if (shouldFail) {
        const fail = {
            job,
            correlationId,
            payload: JSON.stringify({ ok: false, error: "simulated failure" }),
            status: "FAILED",
            serialNumber: serial,
        };
        publishJson(client, topicResult, fail);
        console.log("[sim] published FAILED", fail);
        return;
    }
    const exec = await execute(job, payload);
    const status = exec.ok ? "SUCCESS" : "FAILED";
    const outPayload = exec.ok
        ? exec.out
        : JSON.stringify({ ok: false, error: exec.err ?? "unknown error" });
    const result = {
        job,
        correlationId,
        payload: outPayload,
        status,
        serialNumber: serial,
    };
    publishJson(client, topicResult, result);
    console.log("[sim] published result", result);
});
process.on("SIGINT", () => {
    console.log("[sim] shutdown...");
    client.end(true, () => process.exit(0));
});
