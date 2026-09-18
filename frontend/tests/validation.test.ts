import { test } from "node:test";
import assert from "node:assert/strict";
import { bookingSchema, messageSchema } from "../src/lib/validation";
test("Persian and Arabic phone digits normalize for the API",()=>{for(const phone of ["+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹","+٩٨ ٩١٢ ٣٤٥ ٦٧٨٩"]){const parsed=bookingSchema.parse({name:"آزمایش فارسی",phone,date:"2026-12-01",startTime:"09:00",locale:"fa"});assert.equal(parsed.phone,"+989123456789");assert.equal(parsed.locale,"fa");}});
test("messages and booking details reject invalid submissions",()=>{assert.equal(messageSchema.safeParse({name:"Alex",contact:"bad",message:"A new website"}).success,false);assert.equal(bookingSchema.safeParse({name:"A",phone:"123",date:"bad",startTime:"bad"}).success,false);});
