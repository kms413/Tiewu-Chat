import style from "../css/start.module.less";
import React, { useEffect } from "react";
import gsap from "gsap";
import type { CustomSubmitEvent } from "../types/start";

let luxunImageURI = "";
import("../assets/tiewu.png").then((module) => {
  luxunImageURI = module.default;
});

function StartComponent({ children }: { children: React.ReactNode }) {
  return <div className={style["content-box"]}>
    {children}
  </div>;
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
        if (!child) return;
        const rect = rectsRef.current![i + 1];
        child.style.height = `${rect.height - lineHeight}px`;
        gsap.set(child, {
          x: rect.left + rect.width * 0.5,
          y: rect.top + lineHeight * 0.5,
        });
        gsap.to(child, {
          width: `${rect.width}px`,
          duration: 0.334,
          x: rect.left,
          ease: "back.out",
          overwrite: "auto",
        });
      }, i * 100);
    }
  };
  const handleOnMouseLeave = () => {
    if (!shadowRef.current) return;
    if (!rectsRef.current) return;
    const children: HTMLCollection = shadowRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const rect = rectsRef.current[i + 1]!;
      setTimeout(() => {
        const child = children[i] as HTMLDivElement;
        gsap.to(child, {
          width: "0px",
          x: () => (Math.random() > 0.5 ? rect.left : rect.left + rect.width),
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

function AnimatedLoginInput({
  inputRef,
  placeholder,
  className,
  type = "text",
  suffix,
  onChange,
  onKeyDown,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
  className?: string;
  type?: "text" | "password";
  suffix?: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const [value, setValue] = React.useState("");
  const [caretLeft, setCaretLeft] = React.useState(0);
  const [isFocused, setIsFocused] = React.useState(false);

  const updateCaret = React.useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const pos = input.selectionStart ?? value.length;
    const textBefore =
      type === "password" ? "•".repeat(pos) : value.slice(0, pos);
    const computed = getComputedStyle(input);
    const textIndent = parseFloat(computed.textIndent) || 0;
    const paddingLeft = parseFloat(computed.paddingLeft) || 0;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = `${computed.fontStyle} ${computed.fontVariant} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    const width = ctx.measureText(textBefore).width;
    setCaretLeft(textIndent + paddingLeft + width);
  }, [inputRef, value, type]);

  React.useEffect(() => {
    updateCaret();
  }, [value, updateCaret]);

  React.useEffect(() => {
    if (!document.fonts) return;
    document.fonts.ready.then(updateCaret);
  }, [updateCaret]);

  return (
    <div className={style["animated-input-wrapper"]}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e);
          requestAnimationFrame(updateCaret);
        }}
        onKeyUp={updateCaret}
        onClick={updateCaret}
        onFocus={() => {
          setIsFocused(true);
          updateCaret();
        }}
        onBlur={() => setIsFocused(false)}
        onKeyDown={onKeyDown}
        style={{ caretColor: "transparent" }}
      />
      <span
        className={`${style["animated-caret"]} ${isFocused ? style["animated-caret-visible"] : ""}`}
        style={{ left: caretLeft }}
      />
      {suffix}
    </div>
  );
}

function LoginUserNameComponent({
  onChange,
  inputRef,
  onKeyDown,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  return (
    <LoginInputBox>
      <AnimatedLoginInput
        inputRef={inputRef}
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
  inputRef: React.RefObject<HTMLInputElement | null>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  return (
    <LoginInputBox className={style["login-input-box-password"]}>
      <AnimatedLoginInput
        inputRef={inputRef}
        type={isPasswordVisible ? "text" : "password"}
        placeholder="Password"
        className={`${style["login-input"]} ${style["login-input-password"]}`}
        onChange={onChange}
        onKeyDown={onKeyDown}
        suffix={
          <div
            className={style["login-input-password-icon-box"]}
            onClick={togglePasswordVisibility}
          >
            {isPasswordVisible ? passwordEyeVisibleIcon : passwordEyeHiddenIcon}
          </div>
        }
      />
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
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const createRipple = (clientX?: number, clientY?: number) => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement("span");
    ripple.className = style["login-submit-button-ripple"];
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    const x = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (clientY ?? rect.top + rect.height / 2) - rect.top;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    button.appendChild(ripple);
    gsap.fromTo(
      ripple,
      { scale: 0, opacity: 0.35 },
      {
        scale: 1,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => ripple.remove(),
      },
    );
  };
  const handleOnPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) {
      return;
    }
    createRipple(e.clientX, e.clientY);
  };
  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.repeat || (e.key !== "Enter" && e.key !== " ")) {
      return;
    }
    createRipple();
  };
  return (
    <button
      ref={buttonRef}
      className={style["login-submit-button"]}
      onClick={onClick}
      onPointerDown={handleOnPointerDown}
      onKeyDown={handleOnKeyDown}
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
        draggable={false}
      >
        技术支持 | KMS413
      </a>
    </>
  );
}

const TipsNoUserNameOrPassword = (
  <span className={style["login-tips"]}>请输入用户名或密码</span>
);

function LoginFormComponent({ onSubmit }: { onSubmit: CustomSubmitEvent }) {
  const [isTipVisible, setTipVisible] = React.useState(false);
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] =
    React.useState(false);
  const userNameValue = React.useRef("");
  const passwordValue = React.useRef("");
  const isSubmitted = React.useRef(false);
  const userNameInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  const handleOnUserNameValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    userNameValue.current = e.target.value;
  };
  const handleOnPasswordValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    passwordValue.current = e.target.value;
  };
  const handleOnSubmitButtonClick = () => {
    if (isSubmitted.current) {
      return;
    }
    if (!userNameValue.current || !passwordValue.current) {
      setTipVisible(true);
      setTimeout(() => {
        setTipVisible(false);
      }, 2000);
      return;
    }
    isSubmitted.current = true;
    setIsSubmitButtonDisabled(true);
    onSubmit({
      userName: userNameValue.current,
      password: passwordValue.current,
    });
  };
  const handleOnUserNameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key !== "Enter") {
      return;
    }
    if (!userNameValue.current.trim()) {
      return;
    }
    passwordInputRef.current?.focus();
  };
  const handleOnPasswordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
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
      <span className={style['login-tip']}>提示：用户名和密码完全是摆设</span>
    </div>
  );
}

const LOGIN_BOX_FOLLOWER_COLORS = [
  "#FF0055",  // 霓虹红
  "#FF6B00",  // 霓虹橙
  "#FFE600",  // 霓虹黄
  "#00FF41",  // 霓虹绿
  "#00D4FF",  // 霓虹蓝
  "#7B00FF",  // 霓虹紫
  "#FF00E5",  // 霓虹粉
  "#FFFFFF",  // 白
] as const
const LOGIN_BOX_FOLLOWER_SCALEING_PERIOD_HEIGHT = 70;
const LOGIN_BOX_FOLLOWER_ROTATION_PERIOD_HEIGHT = 100;
const LOGIN_BOX_FOLLOWER_BLUR_STRENGTH = 10;

function LoginComponent({ onSubmit }: { onSubmit: CustomSubmitEvent }) {
  const isMouseEnter = React.useRef(false);
  const loginBoxRef = React.useRef<HTMLDivElement>(null);
  const loginBoxFollowerRef = React.useRef<HTMLDivElement>(null);
  const isLuxunImageLoaded = React.useRef<boolean>(luxunImageURI !== "");
  const luxunImageRef = React.useRef<HTMLImageElement>(null);

  React.useLayoutEffect(()=>{
    if(!luxunImageRef.current) return;
    if(!isLuxunImageLoaded.current){
      import("../assets/tiewu.png").then((res) => {
        if (!luxunImageRef.current) return;
        luxunImageRef.current.src = res.default;
        isLuxunImageLoaded.current = true;
      })
    }
  },[])
  const handleOnMouseEnterLoginBox = () => {
    isMouseEnter.current = true;
  };
  const handleOnMouseLeaveLoginBox = () => {
    isMouseEnter.current = false;
    if (!loginBoxFollowerRef.current) return;
    loginBoxFollowerRef.current.style.opacity = "0";
    loginBoxFollowerRef.current.style.filter = "blur(10px)";
  };
  const handleOnMouseMoveLoginBox = (e: React.MouseEvent<HTMLDivElement>) => {
    if(!isMouseEnter.current) return;
    if(!loginBoxRef.current) return;
    if(!loginBoxFollowerRef.current) return;

    const box = loginBoxRef.current.getBoundingClientRect();
    const mouse = {
      x: e.clientX - box.left,
      y: e.clientY - box.top,
    }
    // 先设置位置
    loginBoxFollowerRef.current.style.left = `${mouse.x}px`;
    loginBoxFollowerRef.current.style.top = `${mouse.y}px`;
    // 算出鼠标在这个区域的颜色索引
    const currentColorId = Math.ceil(mouse.y / box.height * LOGIN_BOX_FOLLOWER_COLORS.length) -1;
    const currentColor = LOGIN_BOX_FOLLOWER_COLORS[currentColorId];
    // 再设置颜色，因为css里有transition属性，所以是有动画的
    loginBoxFollowerRef.current.style.backgroundColor = currentColor;
    // 算出当前缩放的比例
    const currentScale = Math.abs(
      mouse.y % LOGIN_BOX_FOLLOWER_SCALEING_PERIOD_HEIGHT
      - LOGIN_BOX_FOLLOWER_SCALEING_PERIOD_HEIGHT * .5 // 除以2
    ) / LOGIN_BOX_FOLLOWER_SCALEING_PERIOD_HEIGHT * 2;
    // 再设置缩放比例
    loginBoxFollowerRef.current.style.scale = `${currentScale}`;
    // 算出当前旋转的角度
    const currentRotation = mouse.y / LOGIN_BOX_FOLLOWER_ROTATION_PERIOD_HEIGHT * 360;
    // 再设置旋转角度
    loginBoxFollowerRef.current.style.rotate = `${currentRotation}deg`;
    // 算出当前的透明度
    const currentOpacity = currentScale;
    // 设置透明度
    loginBoxFollowerRef.current.style.opacity = `${currentOpacity}`;
    loginBoxFollowerRef.current.style.filter = `blur(${
      (1 - currentOpacity) * LOGIN_BOX_FOLLOWER_BLUR_STRENGTH
    }px)`;
   };

  return (
    <div
      ref={loginBoxRef}
      className={style["login-box"]}
      onMouseEnter={handleOnMouseEnterLoginBox}
      onMouseLeave={handleOnMouseLeaveLoginBox}
      onMouseMove={handleOnMouseMoveLoginBox}
    >
      <div
        ref={loginBoxFollowerRef}
        className={style["login-box-follower"]}
      >
        <img 
        src={luxunImageURI}
        draggable={false}
        style={{ userSelect: "none" }}
        alt="鲁迅" 
        ref={luxunImageRef}
        />
      </div>
      <div className={style["login-box-background"]}></div>
      <div className={style["login-box-border"]}></div>
      <h2 className={style["login-box-title"]}>LOGIN</h2>
      <LoginFormComponent onSubmit={onSubmit} />
    </div>
  );
}

export default StartComponent;
export { TitleComponent, LoginComponent };
