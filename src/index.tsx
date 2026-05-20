import "./styles.scss";
import { Fragment, h, render } from "preact";
import { LMStudioService } from "./services/lmstudio-service.ts";
import { ChatInput } from "./components/chat-input/chat-input.tsx";
import { Icon } from "./components/icon/icon.tsx";
import { Button } from "./components/button/button.tsx";
import { Bubble } from "./components/bubble/bubble.tsx";
import { classNames } from "./platform/preact/class-names.ts";
import { ScrollContainer } from "./components/scroll-container/scroll-container.tsx";
import { Markdown } from "./components/markdown/markdown.tsx";
import { notifyChange } from "./platform/rx/notify-change.ts";
import { useViewModel } from "./platform/rx/use-view-model.ts";
import { rx } from "./platform/rx/rx.ts";
import { TextField } from "./platform/forms/text-field.ts";
import { Input } from "./components/input/input.tsx";

type ChatMessage = {
  sender: "self" | "peer";
  content: string;
};

export class AppViewModel extends EventTarget {
  @rx accessor chatting: boolean;
  @rx accessor messages: Array<ChatMessage>;
  @rx accessor api: LMStudioService;
  @rx accessor message: TextField;

  constructor() {
    super();
    this.messages = [];
    this.chatting = false;
    this.api = new LMStudioService();
    this.message = new TextField();
  }

  async onInit() {
    // this.api.apiAddress.value = "http://localhost:1234";
    // await this.api.connect();
    // this.api.selectModel('liquid/lfm-2.5-1.2b-instruct:free')
    // this.api.selectModel('google/gemma-4-e4b')
  }

  async startChat() {
    if (!this.message.value) return;
    this.chatting = true;

    this.messages.push(
      {
        sender: "self",
        content: this.message.value,
      },
      {
        sender: "peer",
        content: "",
      },
    );

    this.message.update("");

    const response = this.api.streamChatCompletion({
      model: this.api.selectedModel.value,
      messages: this.messages.map((msg) => ({
        role: msg.sender === "self" ? "user" : "assistant",
        content: msg.content,
      })),
      temperature: 0.7,
    });

    for await (const chunk of response) {
      this.messages[this.messages.length - 1].content += chunk;
      notifyChange(this);
    }
  }

  toggleMenu() {
    document.body.classList.toggle("open");
  }

  toggleMenuRight() {
    document.body.classList.toggle("open-right");
  }

  async connect() {
    try {
      await this.api.connect();
    } catch (error) {}
  }

  async disconnect() {
    await this.api.disconnect();
  }
}

function App() {
  const vm = useViewModel(AppViewModel, []);

  return (
    <Fragment>
      <nav className="side-bar side-bar-left">
        <div className="top-bar">
          <div className="logo">
            <Icon icon="brand-hollow" />
            <span>deepscribe</span>
          </div>
          <Button onClick={vm.toggleMenu} className="menu-button">
            <Icon icon="side-bar" height="16px" />
          </Button>
        </div>

        <h2>Chats</h2>
      </nav>

      <main className="main-contents">
        <div className="floating-panel top-left">
          <Icon icon="brand-hollow" height="24px" />
          <Bubble>
            <Button onClick={vm.toggleMenu} className="menu-button">
              <Icon icon="side-bar" height="15px" />
            </Button>
          </Bubble>
        </div>

        <ConnectionIndicator
          className="floating-panel top-right"
          onClick={vm.toggleMenuRight}
          connected={vm.api.connected}
        >
          <Button className="menu-settings">
            <Icon icon="gear" height="18px" />
          </Button>
        </ConnectionIndicator>

        {vm.chatting && (
          <section className="chat-body">
            <ScrollContainer>
              {vm.messages.map((message) => (
                <div
                  key={message.content}
                  className={`chat-bubble ${message.sender}`}
                >
                  <Markdown contents={message.content} className="article" />
                </div>
              ))}
            </ScrollContainer>
          </section>
        )}

        <footer
          className={classNames("chat-input", {
            chatting: vm.chatting,
            disconnected: !vm.api.connected,
          })}
        >
          <ChatInput
            value={vm.message.value}
            onInput={vm.message.fromEvent}
            onSubmit={() => vm.startChat()}
            placeholder={
              vm.api.connected ? "Ask anything" : "Open the settings to connect"
            }
          />
        </footer>
      </main>

      <nav className="side-bar side-bar-right">
        <div className="top-bar">
          <ConnectionIndicator
            onClick={vm.toggleMenuRight}
            connected={vm.api.connected}
            children={">"}
          />
        </div>
        {vm.api.connected ? (
          <Bubble>
            <Button
              onClick={() => vm.disconnect()}
              theme="red"
              className="connect"
            >
              Disconnect
            </Button>
          </Bubble>
        ) : (
          <Bubble>
            <label className="section" htmlFor="">
              <h2>Connection Address</h2>
              <Input
                value={vm.api.apiAddress.value}
                onInput={vm.api.apiAddress.fromEvent}
                placeholder="http://localhost:1234"
              />
            </label>
            <label className="section" htmlFor="">
              <h2>API Key</h2>
              <Input
                value={vm.api.apiKey.value}
                onInput={vm.api.apiKey.fromEvent}
                placeholder="Optional"
              />
            </label>
            {/* <p>Custom Headers</p> */}

            <Button
              disabled={!vm.api.apiAddress.value.length}
              onClick={() => vm.connect()}
              theme="green"
              className="connect"
            >
              Connect
            </Button>
          </Bubble>
        )}

        {vm.api.connected && (
          <Bubble className="model-picker">
            <h2>Models</h2>

            {vm.api.models.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  vm.api.selectModel(m.id);
                  vm.toggleMenuRight();
                }}
                className={classNames("model-name", {
                  selected: vm.api.selectedModel.value === m.id,
                })}
              >
                {m.id}
              </div>
            ))}
          </Bubble>
        )}
      </nav>
    </Fragment>
  );
}

render(<App />, document.body);

function ConnectionIndicator({
  className,
  onClick,
  connected,
  children,
}: {
  className?: string;
  onClick?: () => any;
  connected: boolean;
  children?: any;
}) {
  return (
    <Bubble className={className || ""} onClick={onClick}>
      <Button className="menu-connection">
        {connected ? (
          <Fragment>
            <Icon
              className="connection-icon connected"
              icon="circle"
              height="18px"
            />
            <p>Connected</p>
          </Fragment>
        ) : (
          <Fragment>
            <Icon className="connection-icon" icon="circle" height="18px" />
            <p>Not Connected</p>
          </Fragment>
        )}
      </Button>
      {children}
    </Bubble>
  );
}
