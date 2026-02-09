<script lang="ts" generics="TMessage extends MessageLike<any, any, any>">
    import type { Child, MessageLike, MessageMarkupProps, MessageProps, OpenMarkupFrame } from "./message.js";

    const {
        message,
        inputs,
        options,
        ...rest
    }: MessageProps<TMessage> = $props();

    // TODO(FIXME): This is a bit hacky. See `snippet` below.
    const markup = rest as unknown as MessageMarkupProps<TMessage>;

    let parts: Child<typeof inputs>[] = $derived.by(() => {
        let p: Child<typeof inputs>[] = [];
        if (typeof message.parts === "function") {
            const rawParts = message.parts(inputs, options);
            const stack: OpenMarkupFrame<typeof inputs>[] = [];

            const appendNode = (node: Child<typeof inputs>) => {
                const target = stack[stack.length - 1];
                if (target) {
                    target.children.push(node);
                } else {
                    p = [...p, node];
                }
            };

            for (const part of rawParts) {
                switch (part.type) {
                    case "text":
                        appendNode(part.value);
                        break;
                    case "markup-start":
                        stack.push({
                            name: part.name,
                            children: [],
                            options: part.options,
                            attributes: part.attributes,
                        });
                        break;
                    case "markup-end": {
                        const frame = stack.pop();
                        if (!frame) {
                            throw new Error(`Unexpected closing markup "${part.name}"`);
                        }
                        if (frame.name !== part.name) {
                            throw new Error(
                                `Mismatched markup. Expected closing "${frame.name}" but received "${part.name}"`
                            );
                        }

                        if (!markup[frame.name]) {
                            throw new Error(`No markup renderer found for "${frame.name}"`);
                        }

                        appendNode(
                            {
                                snippet: markup[frame.name]! as any,
                                children: frame.children,
                                options: frame.options,
                                attributes: frame.attributes,
                            }
                        );
                        break;
                    }
                    case "markup-standalone":
                        if (!markup[part.name]) {
                            throw new Error(`No markup renderer found for "${part.name}"`);
                        }

                        appendNode(
                            {
                                snippet: markup[part.name]! as any,
                                children: [],
                                options: part.options,
                                attributes: part.attributes,
                            }
                        );
                        break;
                }
            }

            if (stack.length > 0) {
                const stillOpen = stack[stack.length - 1];
                if (stillOpen) {
                    throw new Error(`Unclosed markup "${stillOpen.name}"`);
                }
            }
        } else {
            p = [
                message(inputs, options),
            ]
        }
        return p;
    });
</script>

{#snippet renderChildren(children: Child<typeof inputs>[])}
    {#each children as child}
        {#if typeof child === "string"}
            {child}
        {:else}
            {#snippet children()}
                {@render renderChildren(child.children)}
            {/snippet}
            {@render child.snippet?.({ options: child.options, attributes: child.attributes, inputs, messageOptions: options, children })}
        {/if}   
    {/each}
{/snippet}

{@render renderChildren(parts)}
