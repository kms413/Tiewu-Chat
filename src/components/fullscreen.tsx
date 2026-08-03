import style from "../css/fullscreen.module.less"
import React from "react"

export default function Fullscreen(
    {
        children
    }: {
        children: React.ReactNode
    }
){
    
    return <div className={style.fullscreen}>
        {children}
    </div>
}