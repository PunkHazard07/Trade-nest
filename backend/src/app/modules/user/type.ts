export interface RegisterInput {
    fullName: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface SafeUser {
    id: string;
    fullName: string;
    email: string;
    createdAt: Date;
}