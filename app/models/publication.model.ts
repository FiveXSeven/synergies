export interface Publication {
    id?: string;
    title: string;
    type: "publi" | "agro" | "";
    description: string;
    content: string;
    location: string;
    eventDate: Date | string;
    photoUrls: string[];
    createdAt: Date | any;
    userId: string;
    userDisplayName?: string;
    views?: number;
}
