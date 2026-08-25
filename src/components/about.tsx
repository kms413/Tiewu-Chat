import style from "../css/about.module.less";

export function Title({ children }: { children: React.ReactNode }) {
  return <h2 className={style.title}>{children}</h2>;
}
export function Pargraph({ children }: { children: React.ReactNode }){
  return <p className={style.pargraph}> {children} </p>
}