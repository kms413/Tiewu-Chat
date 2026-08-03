import style from "../css/start.module.less";
import React, { useEffect } from "react";
import gsap from "gsap";
import type { CustomSubmitEvent } from "../types/start";

function StartComponent({ children }: { children: React.ReactNode }) {
  return <div className={style["content-box"]}>{children}</div>;
}
function TitleComponent() {
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const shadowRef = React.useRef<HTMLDivElement>(null);
  const rectsRef = React.useRef<DOMRectList | null>(null);

  useEffect(() => {
    if (!titleRef.current) return;
  }, []);
  const handleOnMouseEnter = () => {
    if (!titleRef.current) return;
    if (!shadowRef.current) return;
    const range = document.createRange();
    range.selectNode(titleRef.current);
    const rects = range.getClientRects();
    rectsRef.current = rects;
    const children: HTMLCollection = shadowRef.current.children;
    if (rects.length - 1 > children.length) {
      const offset = rects.length - 1 - children.length;
      for (let i = 0; i < offset; i++) {
        const child = document.createElement("div");
        shadowRef.current.appendChild(child);
      }
    } else if (rects.length - 1 < children.length) {
      const offset = children.length - rects.length - 1;
      for (let i = 0; i < offset; i++) {
        shadowRef.current.removeChild(children[i]);
      }
    }
    const rectsLength = rects.length;
    const lineHeight = 40;
    for (let i = 0; i < rectsLength; i++) {
      setTimeout(() => {
        const child = children[i] as HTMLDivElement;
        if(!child) return
        const rect = rects[i + 1];
        child.style.transform = `translate(${rect.left + rect.width * 0.5}px, ${rect.top + lineHeight * 0.5}px)`;
        child.style.height = `${rect.height - lineHeight}px`;
        gsap.to(child, {
          width: `${rect.width}px`,
          duration: 0.334,
          x: rect.left,
          ease: "back.out",
        });
      }, i * 100);
    }
  };
  const handleOnMouseLeave = () => {
    if (!shadowRef.current) return;
    if (!rectsRef.current) return;
    const children: HTMLCollection = shadowRef.current.children;
    for (let i = 0; i < children.length; i++) {
    const rect = rectsRef.current[i+1]!
      setTimeout(() => {
        const child = children[i] as HTMLDivElement;
        gsap.to(child, {
          width: "0px",
          x: () => Math.random() > .5 ? rect.left : rect.left + rect.width,
          duration: 0.334,
          ease: "expo.in",
          overwrite: true,
        });
      }, i * 100);
    }
  };

  return (
    <div className={style["title-box"]}>
      <h1
        ref={titleRef}
        className={style["title"]}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
      >
        Tiewu Chat
      </h1>
      <div ref={shadowRef} className={style["title-box-shadow"]}></div>
    </div>
  );
}

function LoginInputBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${style["login-input-box"]} ${className ?? ""}`}>
      {children}
    </div>
  );
}

const passwordEyeVisibleIcon = (
  <svg
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="1666"
    width="200"
    height="200"
  >
    <path
      d="M512 768c-183.466667 0-328.533333-85.333333-426.666667-256 98.133333-170.666667 243.2-256 426.666667-256s328.533333 85.333333 426.666667 256c-98.133333 170.666667-243.2 256-426.666667 256z m8.533333-426.666667c-128 0-256 55.466667-328.533333 170.666667 72.533333 115.2 200.533333 170.666667 328.533333 170.666667s238.933333-55.466667 311.466667-170.666667c-72.533333-115.2-183.466667-170.666667-311.466667-170.666667z m-8.533333 298.666667c-72.533333 0-128-55.466667-128-128s55.466667-128 128-128 128 55.466667 128 128-55.466667 128-128 128z m0-85.333333c25.6 0 42.666667-17.066667 42.666667-42.666667s-17.066667-42.666667-42.666667-42.666667-42.666667 17.066667-42.666667 42.666667 17.066667 42.666667 42.666667 42.666667z"
      fill="#444444"
      p-id="1667"
    ></path>
  </svg>
);
const passwordEyeHiddenIcon = (
  <svg
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="5424"
    width="200"
    height="200"
  >
    <path
      d="M253.6 679.2l109.6-109.6C356 552 352 532.8 352 512c0-88 72-160 160-160 20.8 0 40 4 57.6 11.2l82.4-82.4C607.2 264.8 560 256 512 256c-168 0-329.6 106.4-384 256 24 65.6 68.8 123.2 125.6 167.2z"
      p-id="5425"
    ></path>
    <path
      d="M416 512v4.8L516.8 416H512c-52.8 0-96 43.2-96 96zM770.4 344.8l163.2-163.2L888 136l-753.6 753.6 45.6 45.6 192.8-192.8A390.4 390.4 0 0 0 512 768c167.2 0 330.4-106.4 384.8-256-24-65.6-69.6-123.2-126.4-167.2zM512 672c-20 0-40-4-57.6-11.2l53.6-53.6h4.8c52.8 0 96-43.2 96-96v-4.8l53.6-53.6C668 472 672 492 672 512c0 88-72 160-160 160z"
      p-id="5426"
    ></path>
  </svg>
);

function LoginUserNameComponent({
  onChange,
  inputRef,
  onKeyDown,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.Ref<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  return (
    <LoginInputBox>
      <input
        ref={inputRef}
        type="text"
        placeholder="UserName"
        className={style["login-input"]}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </LoginInputBox>
  );
}

function LoginPasswordComponent({
  onChange,
  inputRef,
  onKeyDown,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.Ref<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  return (
    <LoginInputBox className={style["login-input-box-password"]}>
      <input
        ref={inputRef}
        type={isPasswordVisible ? "text" : "password"}
        placeholder="Password"
        className={`${style["login-input"]} ${style["login-input-password"]}`}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <div
        className={style["login-input-password-icon-box"]}
        onClick={togglePasswordVisibility}
      >
        {isPasswordVisible ? passwordEyeVisibleIcon : passwordEyeHiddenIcon}
      </div>
    </LoginInputBox>
  );
}
function LoginSubmitComponent({
  onClick,
  disabled,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
}) {
  return (
    <button
      className={style["login-submit-button"]}
      onClick={onClick}
      disabled={disabled}
    >
      SUBMIT
    </button>
  );
}
function LoginDetailsComponent() {
  return (
    <>
      <a
        href="https://github.com/kms413"
        className={style["login-details-tech-support"]}
      >
        技术支持 | KMS413
      </a>
    </>
  );
}

const TipsNoUserNameOrPassword = <span className={style["login-tips"]}>请输入用户名或密码</span>

function LoginFormComponent({
    onSubmit
}: {
    onSubmit: CustomSubmitEvent;
}) {
  const [isTipVisible, setTipVisible] = React.useState(false);
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = React.useState(false);
  const userNameValue = React.useRef("");
  const passwordValue = React.useRef("");
  const isSubmitted = React.useRef(false);
  const userNameInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const handleOnUserNameValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userNameValue.current = e.target.value;
  };
  const handleOnPasswordValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    passwordValue.current = e.target.value;
  };
  const handleOnSubmitButtonClick = () => {
    if(isSubmitted.current){
        return;
    }
    if(!userNameValue.current || !passwordValue.current){
        setTipVisible(true);
        setTimeout(() => {
          setTipVisible(false);
        }, 2000);
        return;
    }
    isSubmitted.current = true;
    setIsSubmitButtonDisabled(true);
    onSubmit({userName: userNameValue.current, password: passwordValue.current});
  };
  const handleOnUserNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") {
      return;
    }
    if (!userNameValue.current.trim()) {
      return;
    }
    passwordInputRef.current?.focus();
  };
  const handleOnPasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") {
      return;
    }
    handleOnSubmitButtonClick();
  };

  return (
    <div className={style["login-form-box"]}>
      {isTipVisible && TipsNoUserNameOrPassword}
      <LoginUserNameComponent
        inputRef={userNameInputRef}
        onChange={handleOnUserNameValueChange}
        onKeyDown={handleOnUserNameKeyDown}
      />
      <LoginPasswordComponent
        inputRef={passwordInputRef}
        onChange={handleOnPasswordValueChange}
        onKeyDown={handleOnPasswordKeyDown}
      />
      <LoginSubmitComponent
        onClick={handleOnSubmitButtonClick}
        disabled={isSubmitButtonDisabled}
      />
      <LoginDetailsComponent />
    </div>
  );
}

function LoginComponent({
    onSubmit
}: {
    onSubmit: CustomSubmitEvent;
}) {
  return (
    <div className={style["login-box"]}>
      <div className={style["login-box-background"]}></div>
      <div className={style["login-box-border"]}></div>
      <h2 className={style["login-box-title"]}>LOGIN</h2>
      <LoginFormComponent onSubmit={onSubmit} />
    </div>
  );
}

export default StartComponent;
export { TitleComponent, LoginComponent };
