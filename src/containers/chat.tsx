import { useNavigate } from "react-router-dom";
import React from "react";
import { jumpStart } from "../lib/animate.jump";
import useStoredState from "../lib/use.stored.state";
import useJumpEndStore from "../stores/useJumpEndStore";
import useChatStore from "../stores/useChatStore";
import { Container, LeftArea, RightArea } from "../components/chat";
import getUserData from "../lib/user.data";

let userData: UserData | null = null;

function Main() {
  const jumpEndStore = useJumpEndStore();

  if (jumpEndStore.remove) {
    jumpStart();
    jumpEndStore.remove();
  }
  const handleOnNewChat = () => {
    useChatStore.getState().startNewSession();
  };
  return (
    <Container>
      <LeftArea onNewChat={handleOnNewChat} />
      <RightArea />
    </Container>
  );
}

function Redirect() {
  const navigate = useNavigate();
  const [user] = useStoredState<User>("user", null);

  React.useLayoutEffect(() => {
    (async () => {
      userData = await getUserData();
      if (!user || !userData) {
        navigate("/start");
      }
    })();
  }, [user, navigate]);
  return <Main/>;
}

function Chat() {
  return <Redirect />;
}
export default Chat;
