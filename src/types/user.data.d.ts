type UserData = {
    AIs: {
        [key: string]: {
            name: string;
            preset: AIPreset[number] | null;
            apikey: string;
            custom?: {
                url: string;
                model: string;
                agreement: "openai" | "anthropic",
            }
        }
    }
}
