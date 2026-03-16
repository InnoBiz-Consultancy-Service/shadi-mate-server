export enum Gender {
    MALE = "male",
    FEMALE = "female",
}

export enum GuardianRelation {
    FATHER = "father",
    MOTHER = "mother",
    BROTHER = "brother",
    SISTER = "sister",
    UNCLE = "uncle",
    AUNT = "aunt",
    GUARDIAN = "guardian",
}

export interface QueryParams {
    search?: string;
    university?: string;
    division?: string;
    district?: string;
    thana?: string;
    gender?: string;
    address?: string;
    page?: number;
    limit?: number;
    sort?: string;
}
