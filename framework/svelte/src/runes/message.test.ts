import { render } from "svelte/server";
import { expect, test } from "vitest";
import { m } from "../paraglide/messages.js";
import MessageCTATest from "./MessageCTATest.svelte";
import MessageNestedCTATest from "./MessageNestedCTATest.svelte";
import Message from "./Message.svelte";

function normalizeSsrBody(body: string): string {
	return body.replace(/<!--[\s\S]*?-->/g, "");
}

test("renders compiled plain messages when parts() is not present", () => {
	const { body } = render(Message,
		{
			// TODO(FIXME): Seems a little wonky.
			props: { message: m.hello, inputs: { name: "Ada" } } as any
		}
	);

	expect(normalizeSsrBody(body)).toBe("Hello Ada");
	expect("parts" in m.hello).toBe(false);
});

test("renders compiled markup and exposes options/attributes as records", () => {
	const { body } = render(MessageCTATest, {});

	expect(normalizeSsrBody(body)).toBe(
		'<a href="/docs" data-track="true">Read docs</a>'
	);
});

test("renders compiled nested markup", () => {
	const { body } = render(MessageNestedCTATest, {});

	expect(normalizeSsrBody(body)).toBe(
		'<a href="/docs"><strong>Read docs</strong></a>'
	);
});
