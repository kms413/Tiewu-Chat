import style from "../css/jump.module.less";



export function jumpEnd() {
  return new Promise((resolve)=>{
    const container = document.createElement("div");
    container.classList.add(style["jump-end"]);
    document.body.appendChild(container);
    setTimeout(()=>{
      resolve(()=>{
        container.remove();
      });
    }, 1000);
  })
}

export function jumpStart() {
  return new Promise((resolve)=>{
    const container = document.createElement("div");
    container.classList.add(style["jump-start"]);
    document.body.appendChild(container);
    setTimeout(()=>{
      container.remove();
      resolve(null);
    }, 1000);
  })
}
