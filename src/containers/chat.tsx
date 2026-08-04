import { useNavigate } from "react-router-dom";
import React from "react";
import { jumpStart } from "../lib/animateJump";
import useStoredState from "../lib/useStoredState";
import useJumpEndStore from "../stores/useJumpEndStore";
import useChatStore from "../stores/useChatStore";
import {
  Container,
  LeftArea,
  RightArea
} from "../components/chat";
import getUserData from "../lib/userdata";

let userData: UserData | null = null

function Main({
  isTransition = false
}: {
  isTransition?: boolean
}) {
  const jumpEndStore = useJumpEndStore();
  jumpEndStore.remove();
  if(isTransition) jumpStart()
  const handleOnNewChat = () => {
    useChatStore.getState().startNewSession();
  };
  return <Container>
    <LeftArea onNewChat={handleOnNewChat} />
    <RightArea />
  </Container>;
}

function Redirect({
  isTransition = false
}: {
  isTransition?: boolean
}) {
  const navigate = useNavigate();
  const [user] = useStoredState<User>("user", null);

  React.useLayoutEffect(() => {
    (async () => {
      userData = await getUserData()
      if (!user || !userData) {
        navigate("/start");
      }
    })()
  }, [user, navigate]);
  return <Main isTransition={isTransition} />;
}

function Chat({
  isTransition = false
}: {
  isTransition?: boolean
}) {
  return <Redirect isTransition={isTransition}/>;
}
export default Chat;
