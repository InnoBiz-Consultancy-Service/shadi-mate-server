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
export enum Personality {
    CARING_SOUL = "Caring Soul",
    BALANCED_THINKER = "Balanced Thinker",
    AMBITIOUS_MIND = "Ambitious Mind",
}
export enum EconomicalStatus {
    LOW = "Low",
    MEDIUM = "Medium",
    HIGH = "High",
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
export enum Habits {
  READING_BOOKS = "Reading Books",
  TRAVELING = "Traveling",
  COOKING = "Cooking",
  SPORTS = "Sports",
  GYM_FITNESS = "Gym/Fitness",
  WATCHING_MOVIES = "Watching Movies",
  LISTENING_TO_MUSIC = "Listening to Music",
  PHOTOGRAPHY = "Photography",
  GARDENING = "Gardening",
  GAMING = "Gaming",
  WRITING = "Writing",
  ART_AND_CRAFT = "Art & Craft",
  SOCIAL_WORK = "Social Work",
  ENTREPRENEURSHIP = "Entrepreneurship",
  TECHNOLOGY = "Technology",
  OTHERS = "others",
}