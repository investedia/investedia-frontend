import { readSnapshot } from "./markets.json.js";
export const onRequest = context => readSnapshot(context, "fx");
