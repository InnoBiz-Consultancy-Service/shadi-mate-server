export interface IAnswer {
    questionId: string;
    selectedOption: "agree" | "sometimes" | "disagree";
}

export interface ISubmitTestPayload {
    name: string;
    phone: string;
    gender: "male" | "female";
    answers: IAnswer[];
}