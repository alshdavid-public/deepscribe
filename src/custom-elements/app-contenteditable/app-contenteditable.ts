// @ts-expect-error
import css from "./app-contenteditable.css?type=raw";

/* 
  Using a custom element for the content editable textarea
  because managing React's state lifecycle/sync with the
  contents of the component became tricky - resulting in
  the cursor jumping unexpectedly.

  A custom element could be validated in isolation of React
  and added in with bindings.

  This has limitations, such as not being able to be SSR'd
  via "renderToStream" - but that's okay.
*/
const styles = new CSSStyleSheet();
styles.replaceSync(css);

export class HTMLContentEditable extends HTMLElement {
  shadowRoot;
  #value: string;
  #$editable: HTMLDivElement;

  get disabled(): boolean {
    return !(
      !this.hasAttribute("disabled") ||
      this.getAttribute("disabled") === "false"
    );
  }

  set disabled(value: boolean) {
    this.setAttribute("disabled", `${value}`);
    this.#$editable.setAttribute("disabled", `${value}`);
    this.#$editable.setAttribute("contenteditable", `${!this.disabled}`);
  }

  get placeholder(): string | null {
    return this.getAttribute("placeholder");
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
    this.#$editable.setAttribute("data-placeholder", value);
  }

  get value() {
    return this.#value;
  }

  set value(value: string) {
    if (this.#value === value) return;
    this.#value = value;
    this.#$editable.innerText = this.#value;
  }

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: "open", delegatesFocus: true });
    this.shadowRoot.adoptedStyleSheets = [styles];

    this.#$editable = globalThis.document.createElement("div");

    const placeholder = this.getAttribute("placeholder");
    if (placeholder) {
      this.#$editable.setAttribute("data-placeholder", placeholder);
    }

    const disabled =
      this.hasAttribute("disabled") || this.getAttribute("disabled") === "true";
    if (disabled) {
      this.#$editable.setAttribute("disabled", `${disabled}`);
    }

    this.#$editable.setAttribute("contenteditable", `${!disabled}`);
    this.#value = this.getAttribute("value") || "";

    this.shadowRoot.appendChild(this.#$editable);

    this.addEventListener("input", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.addEventListener("blur", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.addEventListener("focus", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.addEventListener("paste", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.#$editable.addEventListener("input", () => {
      if (this.#$editable.innerText === "\n") {
        this.#$editable.innerHTML = "";
      }
      this.#value = this.#$editable.innerText;
      this.dispatchEvent(new InputEvent("input", { bubbles: true }));
    });

    this.#$editable.addEventListener("paste", (e) => {
      // 1. Prevent default formatting/pasting
      e.preventDefault();
      e.stopPropagation();

      // 2. Get plain text from clipboard
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      // 3. Get the selection specifically from the ShadowRoot context
      // Fallback to document.getSelection() if shadowRoot.getSelection() isn't available
      const selection = this.shadowRoot.getSelection
        ? this.shadowRoot.getSelection()
        : Array.from(window.getSelection()).find((s) =>
            this.shadowRoot.contains(s.anchorNode),
          );

      // Alternative robust approach: Use the document selection but verify the range
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;

      const range = domSelection.getRangeAt(0);

      // 4. Ensure the range is actually inside our editable element
      // This is the "fix" for pasting "above" the element
      if (!this.#$editable.contains(range.commonAncestorContainer)) {
        // If the selection is lost or outside, move it to the end of our text
        range.selectNodeContents(this.#$editable);
        range.collapse(false);
      }

      // 5. Insert the text
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // 6. Move cursor to after the inserted text
      range.setStartAfter(textNode);
      range.collapse(true);
      domSelection.removeAllRanges();
      domSelection.addRange(range);

      // 7. Update internal state and fire event
      this.#value = this.#$editable.innerText;
      this.dispatchEvent(
        new InputEvent("input", { bubbles: true, composed: true }),
      );
    });
  }

  static register(name = "app-contenteditable") {
    customElements.define(name, HTMLContentEditable);
  }

  focus = () => {
    this.#$editable.focus();
  };

  blur = () => {
    this.#$editable.blur();
  };
}
