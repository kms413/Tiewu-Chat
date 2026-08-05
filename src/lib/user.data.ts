import localforage from "localforage";
const INSTANCE_NAME = "userdata";
const DATA_KEY = "userdata";
export default async function getUserData(): Promise<UserData | null>{
    const instance = localforage.createInstance({
        name: INSTANCE_NAME,
    });

    const data  = await instance.getItem<UserData>(DATA_KEY)
    return data || null;
}
export {
    INSTANCE_NAME,
    DATA_KEY
}