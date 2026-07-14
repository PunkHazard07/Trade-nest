export interface RegisterInput {
    fullName: string;
    email: string;
    password: string;
    phoneNumbers: string[];
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface UpdateProfileInput {
    fullName?: string;
    email?: string;
    phoneNumbers?:  PhoneNumberInput[];
}

export interface SafePhone {
    id: string;
    number: string;
    isPrimary: boolean;
}

export interface SafeUser {
    id: string;
    fullName: string;
    email: string;
    createdAt: Date;
    phoneNumbers: SafePhone[];
}

export interface PhoneNumberInput {
    id?: string;     
    number: string;
}