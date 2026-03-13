import { PersonalityQuestion } from "../app/modules/personalityQuestion/personalityQuestions.model";

export const maleQuestions = [
    {
        id: "m_q1",
        gender: 'male',
        questionText: {
            bn: 'অফিস বা কাজ শেষে বাসায় ফিরে আপনার প্রথম কাজ কী থাকে?',
            en: 'What is the first thing you do after returning home from work?'
        },
        options: [
            { label: 'ক', bn: 'নিজের রুমে গিয়ে বিশ্রাম নেওয়া', en: 'Go to my room and rest' },
            { label: 'খ', bn: 'পরিবারের সাথে বসে গল্প করা', en: 'Sit and chat with family' },
            { label: 'গ', bn: 'মোবাইল বা গেমে মজে যাওয়া', en: 'Get busy with mobile or gaming' }
        ],
        note: 'Family Orientation'
    },
    {
        id: "m_q2",
        gender: 'male',
        questionText: {
            bn: 'আপনার রুম বা আলমারি গোছানোর দায়িত্ব সাধারণত কার?',
            en: 'Who is usually responsible for organizing your room or wardrobe?'
        },
        options: [
            { label: 'ক', bn: 'মা বা বোন গুছিয়ে দেয়', en: 'Mother or sister organizes it' },
            { label: 'খ', bn: 'আমি নিজেই অগোছালো থাকি', en: 'I prefer staying messy' },
            { label: 'গ', bn: 'আমি নিজের জিনিস গুছিয়ে রাখতে পছন্দ করি', en: 'I like to organize my own things' }
        ],
        note: 'Self-Dependency'
    },
    {
        id: "m_q3",
        gender: 'male',
        questionText: {
            bn: 'প্রিয় কাজ করার সময় মা-বাবা কোনো কাজ দিলে আপনি কী করেন?',
            en: 'How do you react if your parents ask for help while you’re doing something you love?'
        },
        options: [
            { label: 'ক', bn: 'রেগে যাই বা পরে করব বলি', en: 'Get angry or say I will do it later' },
            { label: 'খ', bn: 'সাথে সাথে কাজটা করি', en: 'Do it immediately' },
            { label: 'গ', bn: 'বিরক্তি নিয়ে কাজটা শেষ করি', en: 'Finish it with annoyance' }
        ],
        note: 'Patience & Respect'
    },
    {
        id: "m_q4",
        gender: 'male',
        questionText: {
            bn: 'আপনি কি মনে করেন ঘরের কাজ শুধু মেয়েদের কাজ?',
            en: 'Do you believe household chores are only for women?'
        },
        options: [
            { label: 'ক', bn: 'হ্যাঁ, এটাই নিয়ম', en: 'Yes, that is the rule' },
            { label: 'খ', bn: 'না, যে কেউ করতে পারে', en: 'No, anyone can do it' },
            { label: 'গ', bn: 'আমি প্রয়োজনে সাহায্য করতে রাজি', en: 'I am willing to help if needed' }
        ],
        note: 'Gender Equality'
    },
    {
        id: "m_q5",
        gender: 'male',
        questionText: {
            bn: 'কাছের মানুষের সাথে ঝগড়া হলে আপনি কী করেন?',
            en: 'What do you do when you have a conflict with someone close?'
        },
        options: [
            { label: 'ক', bn: 'আগে সরি বলি', en: 'I apologize first' },
            { label: 'খ', bn: 'সে সরি না বলা পর্যন্ত কথা বলি না', en: 'I don’t speak until they apologize' },
            { label: 'গ', bn: 'চুপচাপ থেকে ঝামেলা এড়িয়ে চলি', en: 'I stay quiet and avoid the trouble' }
        ],
        note: 'Conflict Management'
    },
    {
        id: "m_q6",
        gender: 'male',
        questionText: {
            bn: 'বাজেট শেষ হয়ে গেলে আপনি পরিস্থিতি কীভাবে সামলান?',
            en: 'How do you handle it when you run out of budget?'
        },
        options: [
            { label: 'ক', bn: 'কারো থেকে ধার করি', en: 'Borrow from someone' },
            { label: 'খ', bn: 'বাজেট কমিয়ে ধৈর্য ধরি', en: 'Cut expenses and be patient' },
            { label: 'গ', bn: 'খুব হতাশ হয়ে পড়ি', en: 'Get very frustrated' }
        ],
        note: 'Financial Discipline'
    },
    {
        id: "m_q7",
        gender: 'male',
        questionText: {
            bn: 'অপরিচিত কেউ বিপদে পড়লে আপনার প্রতিক্রিয়া কী হয়?',
            en: 'How do you react when a stranger is in trouble?'
        },
        options: [
            { label: 'ক', bn: 'সাহায্য করার চেষ্টা করি', en: 'Try to help' },
            { label: 'খ', bn: 'এড়িয়ে নিজের পথে চলি', en: 'Avoid and move on' },
            { label: 'গ', bn: 'দূর থেকে দেখি কী হয়', en: 'Watch from a distance' }
        ],
        note: 'Empathy'
    },
    {
        id: "m_q8",
        gender: 'male',
        questionText: {
            bn: 'পছন্দের প্ল্যান হুট করে বাতিল হলে আপনি কী করেন?',
            en: 'What do you do if a favorite plan is suddenly canceled?'
        },
        options: [
            { label: 'ক', bn: 'খুব মেজাজ খারাপ হয়', en: 'Get very upset' },
            { label: 'খ', bn: 'স্বাভাবিকভাবে নিই ও বিকল্প খুঁজি', en: 'Take it normally and find an alternative' },
            { label: 'গ', bn: 'সারাদিন মন খারাপ করে থাকি', en: 'Stay sad all day' }
        ],
        note: 'Adaptability'
    },
    {
        id: "m_q9",
        gender: 'male',
        questionText: {
            bn: 'ভুলের জন্য ক্ষমা চাইতে আপনার কেমন লাগে?',
            en: 'How do you feel about apologizing for your mistakes?'
        },
        options: [
            { label: 'ক', bn: 'এটি আমার ইগোতে লাগে', en: 'It hurts my ego' },
            { label: 'খ', bn: 'সরি বলতে দ্বিধা করি না', en: 'I don’t hesitate to say sorry' },
            { label: 'গ', bn: 'আমি সাধারণত ভুল স্বীকার করি না', en: 'I usually don’t admit mistakes' }
        ],
        note: 'Humility'
    },
    {
        id: "m_q10",
        gender: 'male',
        questionText: {
            bn: 'সোশ্যাল মিডিয়ায় ব্যক্তিগত জীবন শেয়ার করা নিয়ে আপনার মত কী?',
            en: 'What is your opinion on sharing personal life on social media?'
        },
        options: [
            { label: 'ক', bn: 'হ্যাঁ, সব আপডেট দিই', en: 'Yes, I give all updates' },
            { label: 'খ', bn: 'শুধু প্রয়োজনীয় কিছু শেয়ার করি', en: 'Share only necessary things' },
            { label: 'গ', bn: 'ব্যক্তিগত বিষয় আড়ালে রাখতে চাই', en: 'Keep personal life private' }
        ],
        note: 'Privacy'
    },
    {
        id: "m_q11",
        gender: 'male',
        questionText: {
            bn: 'বড় সিদ্ধান্ত নেওয়ার আগে কার পরামর্শ নেন?',
            en: 'Whom do you consult before taking a big decision?'
        },
        options: [
            { label: 'ক', bn: 'কারো না, আমি নিজেই নিই', en: 'No one, I decide myself' },
            { label: 'খ', bn: 'অভিজ্ঞ বা বিশ্বস্ত কারো', en: 'Someone experienced or trusted' },
            { label: 'গ', bn: 'পরিবারের সবার সাথে কথা বলি', en: 'Talk to the whole family' }
        ],
        note: 'Consultation'
    },
    {
        id: "m_q12",
        gender: 'male',
        questionText: {
            bn: 'কাছের কেউ ভুল করলে কীভাবে বোঝান?',
            en: 'How do you correct someone close when they make a mistake?'
        },
        options: [
            { label: 'ক', bn: 'সরাসরি বকা দিই', en: 'Scold them directly' },
            { label: 'খ', bn: 'আড়ালে নিয়ে বুঝিয়ে বলি', en: 'Explain to them privately' },
            { label: 'গ', bn: 'আমি কিছু বলা পছন্দ করি না', en: 'I prefer not to say anything' }
        ],
        note: 'Communication'
    },
    {
        id: "m_q13",
        gender: 'male',
        questionText: {
            bn: 'ধূমপান বা নেশাজাতীয় অভ্যাসের প্রতি আপনার মনোভাব কী?',
            en: 'What is your attitude towards smoking or addiction?'
        },
        options: [
            { label: 'ক', bn: 'আমি নিয়মিত করি', en: 'I do it regularly' },
            { label: 'খ', bn: 'মাঝে মাঝে করি', en: 'I do it occasionally' },
            { label: 'গ', bn: 'একদমই করি না', en: 'I don’t do it at all' }
        ],
        note: 'Health Choice'
    },
    {
        id: "m_q14",
        gender: 'male',
        questionText: {
            bn: 'অবসরে আপনি কোনটি বেশি পছন্দ করেন?',
            en: 'What do you prefer in your leisure time?'
        },
        options: [
            { label: 'ক', bn: 'বই পড়া বা নতুন কিছু শেখা', en: 'Reading or learning something new' },
            { label: 'খ', bn: 'মুভি বা সোশ্যাল মিডিয়া', en: 'Movies or social media' },
            { label: 'গ', bn: 'ঘুমিয়ে সময় কাটানো', en: 'Spending time sleeping' }
        ],
        note: 'Intellectual Interest'
    },
    {
        id: "m_q15",
        gender: 'male',
        questionText: {
            bn: 'রাগ হলে আপনি সাধারণত কী করেন?',
            en: 'What do you usually do when you get angry?'
        },
        options: [
            { label: 'ক', bn: 'চেঁচামেচি বা ভাঙচুর করি', en: 'Shout or break things' },
            { label: 'খ', bn: 'চুপচাপ একা হয়ে যাই', en: 'Become quiet and stay alone' },
            { label: 'গ', bn: 'পরিস্থিতি বুঝে শান্ত থাকার চেষ্টা করি', en: 'Try to stay calm based on situation' }
        ],
        note: 'Anger Management'
    }
];

export const femaleQuestions = [
    {
        id: "f_q1",
        gender: 'female',
        questionText: {
            bn: 'বাসায় হুট করে মেহমান চলে আসলে আপনার অনুভূতি কী?',
            en: 'How do you feel if guests arrive suddenly at home?'
        },
        options: [
            { label: 'ক', bn: 'আমি খুব বিরক্ত হই', en: 'I get very annoyed' },
            { label: 'খ', bn: 'হাসিমুখে আপ্যায়ন করি', en: 'Welcome them with a smile' },
            { label: 'গ', bn: 'নিজের রুমে গিয়ে বসে থাকি', en: 'Go and sit in my room' }
        ],
        note: 'Hospitality'
    },
    {
        id: "f_q2",
        gender: 'female',
        questionText: {
            bn: 'নতুন পরিবেশে মানিয়ে নিতে আপনার কেমন সময় লাগে?',
            en: 'How long does it take for you to adapt to a new environment?'
        },
        options: [
            { label: 'ক', bn: 'খুব দ্রুত মিশে যাই', en: 'I mix very quickly' },
            { label: 'খ', bn: 'বেশ কিছুটা সময় লাগে', en: 'It takes some time' },
            { label: 'গ', bn: 'আমি একা থাকতে পছন্দ করি', en: 'I prefer to stay alone' }
        ],
        note: 'Social Integration'
    },
    {
        id: "f_q3",
        gender: 'female',
        questionText: {
            bn: 'প্রিয় কোনো জিনিস কেউ নষ্ট করলে আপনি কী করেন?',
            en: 'What do you do if someone ruins your favorite thing?'
        },
        options: [
            { label: 'ক', bn: 'খুব ঝগড়া বা কান্নাকাটি করি', en: 'Fight or cry a lot' },
            { label: 'খ', bn: 'মন খারাপ হলেও ক্ষমা করে দিই', en: 'Forgive even if I am sad' },
            { label: 'গ', bn: 'মনে মনে রাগ পুষে রাখি', en: 'Hold a grudge in my heart' }
        ],
        note: 'Forgiveness'
    },
    {
        id: "f_q4",
        gender: 'female',
        questionText: {
            bn: 'ক্যারিয়ার বা শিক্ষার ক্ষেত্রে আপনি কতটা আপোষহীন?',
            en: 'How uncompromising are you regarding career or education?'
        },
        options: [
            { label: 'ক', bn: 'ক্যারিয়ারই আমার কাছে আগে', en: 'Career comes first to me' },
            { label: 'খ', bn: 'ক্যারিয়ার ও পরিবার দুটোই সমান', en: 'Both career and family are equal' },
            { label: 'গ', bn: 'প্রয়োজনে পরিবারের জন্য ছাড় দিতে পারি', en: 'Can sacrifice for family if needed' }
        ],
        note: 'Priority'
    },
    {
        id: "f_q5",
        gender: 'female',
        questionText: {
            bn: 'বাসার কাজে বড়দের সাহায্য করতে আপনার কেমন লাগে?',
            en: 'How do you feel about helping elders with household chores?'
        },
        options: [
            { label: 'ক', bn: 'পছন্দ করি না', en: 'I don’t like it' },
            { label: 'খ', bn: 'প্রয়োজনে করি', en: 'Do it if necessary' },
            { label: 'গ', bn: 'নিজের দায়িত্ব মনে করে করি', en: 'Do it as my own responsibility' }
        ],
        note: 'Responsibility'
    },
    {
        id: "f_q6",
        gender: 'female',
        questionText: {
            bn: 'বিয়ের পর স্বামীর ইনকামে চলা নিয়ে আপনার মত কী?',
            en: 'What is your view on living on the husband’s income after marriage?'
        },
        options: [
            { label: 'ক', bn: 'হ্যাঁ, এটাই নিয়ম', en: 'Yes, that is the rule' },
            { label: 'খ', bn: 'না, দুজনেরই অবদান থাকা উচিত', en: 'No, both should contribute' },
            { label: 'গ', bn: 'সামর্থ্য থাকলে চাকরি করতে চাই', en: 'I want to work if capable' }
        ],
        note: 'Financial Independence'
    },
    {
        id: "f_q7",
        gender: 'female',
        questionText: {
            bn: 'মেজাজ খারাপ থাকলে আপনি কী করেন?',
            en: 'What do you do when you are in a bad mood?'
        },
        options: [
            { label: 'ক', bn: 'অন্যদের সাথে খারাপ ব্যবহার করি', en: 'Misbehave with others' },
            { label: 'খ', bn: 'চুপচাপ থাকি যতক্ষণ না শান্ত হই', en: 'Stay quiet until I calm down' },
            { label: 'গ', bn: 'কান্নাকাটি করে হালকা হই', en: 'Cry to feel lighter' }
        ],
        note: 'Emotional Stability'
    },
    {
        id: "f_q8",
        gender: 'female',
        questionText: {
            bn: 'শপিং করার সময় আপনার অভ্যাস কেমন?',
            en: 'What are your habits when shopping?'
        },
        options: [
            { label: 'ক', bn: 'প্রয়োজনের চেয়ে বেশি কিনি', en: 'Buy more than needed' },
            { label: 'খ', bn: 'শুধু প্রয়োজনীয় জিনিস কিনি', en: 'Buy only necessary things' },
            { label: 'গ', bn: 'খুব বিচার-বিবেচনা করে কিনি', en: 'Buy very thoughtfully' }
        ],
        note: 'Spending Habits'
    },
    {
        id: "f_q9",
        gender: 'female',
        questionText: {
            bn: 'কাছের কেউ সমালোচনা করলে আপনি কীভাবে রিয়েক্ট করেন?',
            en: 'How do you react when someone close criticizes you?'
        },
        options: [
            { label: 'ক', bn: 'সাথে সাথে পাল্টা জবাব দিই', en: 'Give an instant reply' },
            { label: 'খ', bn: 'মন দিয়ে শুনি ও উন্নতির চেষ্টা করি', en: 'Listen and try to improve' },
            { label: 'গ', bn: 'নিজেকে গুটিয়ে নিই', en: 'Withdraw myself' }
        ],
        note: 'Criticism Handling'
    },
    {
        id: "f_q10",
        gender: 'female',
        questionText: {
            bn: 'নিজের শখ নিয়ে আপনি কতটা সচেতন?',
            en: 'How conscious are you about your hobbies?'
        },
        options: [
            { label: 'ক', bn: 'এটি আমার জীবনের অবিচ্ছেদ্য অংশ', en: 'It is an integral part of my life' },
            { label: 'খ', bn: 'সময় পেলে করি', en: 'Do it if I have time' },
            { label: 'গ', bn: 'বাস্তবতাকে বেশি গুরুত্ব দিই', en: 'Prioritize reality more' }
        ],
        note: 'Self-Passion'
    },
    {
        id: "f_q11",
        gender: 'female',
        questionText: {
            bn: 'ব্যক্তিগত কথা অন্যের সাথে শেয়ার করতে কেমন লাগে?',
            en: 'How do you feel about sharing personal matters with others?'
        },
        options: [
            { label: 'ক', bn: 'আড্ডা দিলে এমন কথা হবেই', en: 'Chatting leads to such talks' },
            { label: 'খ', bn: 'দূরে থাকতে পছন্দ করি', en: 'Prefer to stay away' },
            { label: 'গ', bn: 'শুধু দরকারি কথা বলি', en: 'Only talk about necessary things' }
        ],
        note: 'Integrity'
    },
    {
        id: "f_q12",
        gender: 'female',
        questionText: {
            bn: 'কাজ সময়মতো শেষ না হলে টেনশন হয়?',
            en: 'Do you get tensed if work is not finished on time?'
        },
        options: [
            { label: 'ক', bn: 'খুব অস্থির হয়ে যাই', en: 'Get very restless' },
            { label: 'খ', bn: 'ধৈর্য ধরে শেষ করি', en: 'Finish with patience' },
            { label: 'গ', bn: 'মাথা ঘামাই না', en: 'Don’t worry much' }
        ],
        note: 'Work Ethics'
    },
    {
        id: "f_q13",
        gender: 'female',
        questionText: {
            bn: 'জীবনে ধর্মের গুরুত্ব কতটুকু?',
            en: 'How much importance does religion have in your life?'
        },
        options: [
            { label: 'ক', bn: 'ধর্মই প্রধান পরিচয়', en: 'Religion is the main identity' },
            { label: 'খ', bn: 'মডার্ন লাইফ ও ধর্ম দুটাই মানি', en: 'Follow both modern life and religion' },
            { label: 'গ', bn: 'এটি ব্যক্তিগত বিষয়', en: 'It is a personal matter' }
        ],
        note: 'Values'
    },
    {
        id: "f_q14",
        gender: 'female',
        questionText: {
            bn: 'বাবা-মার সাথে আপনার সম্পর্ক কেমন?',
            en: 'How is your relationship with your parents?'
        },
        options: [
            { label: 'ক', bn: 'বন্ধুর মতো সব শেয়ার করি', en: 'Share everything like a friend' },
            { label: 'খ', bn: 'শুধু কাজের কথা হয়', en: 'Only talk about work/necessities' },
            { label: 'গ', bn: 'তাদের খুব ভয় পাই', en: 'I am very afraid of them' }
        ],
        note: 'Bonding'
    },
    {
        id: "f_q15",
        gender: 'female',
        questionText: {
            bn: 'কেউ আপনাকে ছোট করলে কী করেন?',
            en: 'What do you do if someone underestimates you?'
        },
        options: [
            { label: 'ক', bn: 'হীনম্মন্যতায় ভুগি', en: 'Feel inferior' },
            { label: 'খ', bn: 'কাজের মাধ্যমে প্রমাণ করি', en: 'Prove through my work' },
            { label: 'গ', bn: 'কান দিই না', en: 'I don’t pay attention' }
        ],
        note: 'Self-Confidence'
    }
];

