export interface RegisterVendorInput {
    email: string;
    password: string;
    fullName: string;
    phoneNumbers: string[];
    storeName: string;
    storeSlug: string;
    description?: string;
}

export interface BecomeVendorInput {
    storeName: string;
    storeSlug: string;
    description?: string;
}

export interface UpdateVendorInput {
    storeName?: string;
    description?: string;
}

export interface ListVendorsQuery {
    search?: string;
    isVerified?: boolean;
    sortBy?: "createdAt" | "storeName";
    order?: "asc" | "desc";
    page?: number;
    limit?: number;
}