import Fullscreen from "../components/fullscreen";
import StartComponent, {
  TitleComponent,
  LoginComponent,
} from "../components/start";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import theme from "../css/theme.module.less";
import { jumpEnd } from "../lib/animateJump";
import useJumpEndStore, { type JumpEndStore } from "../stores/useJumpEndStore";
import useStoredState from "../lib/useStoredState";
import React from "react";
import initUserData from "../lib/init.user.data";
import { sha256 } from "../lib/hash";

async function login(
  e: {
    userName: string;
    password: string;
  },
  navigate: NavigateFunction,
  jumpEndStore: JumpEndStore,
  setUser: (value: User) => void,
) {
  const username = e.userName || "滚木";
  const passwordHash = await sha256(e.password || "滚木");
  const remove = (await jumpEnd()) as () => void;
  jumpEndStore.setRemove(remove);
  setUser({ name: username, password: passwordHash });
  await initUserData()
  navigate("/chat");
}

console.log(theme);

function Start() {
  const currentNavigate = useNavigate();
  const jumpEndStore = useJumpEndStore();
  const [user, setUser] = useStoredState<User>("user", null);
  React.useLayoutEffect(()=>{
    if(user){
      currentNavigate("/chat");
    }
  },[user, currentNavigate])
  return (
    <Fullscreen>
      <StartComponent>
        <TitleComponent />
        <LoginComponent
          onSubmit={(e) => {
            login(e, currentNavigate, jumpEndStore, setUser);
          }}
        />
      </StartComponent>
    </Fullscreen>
  );
}

export default Start;
