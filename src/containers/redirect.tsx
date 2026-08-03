import { useNavigate } from "react-router-dom"
import useStoredState from "../lib/useStoredState"
import { useLayoutEffect } from "react"

export default function Redirect() {
    const navigate = useNavigate()
    const [user] = useStoredState<User>("user", null)
    useLayoutEffect(() => {
        if (user) {
            navigate("/chat");
        } else {
            navigate("/start");
        }
    }, [user, navigate])
    return <></>
}