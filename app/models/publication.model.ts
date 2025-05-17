import { Timestamp } from "firebase/firestore";

export interface Publication {
    id?: string; // Optionnel, sera généré par Firestore
    title: string;
    type: "publi" | "agro" | ""; // 'publi-reportage' et 'agro-echo'
    description: string;
    content: string;
    location: string;
    eventDate: Date | Timestamp; // Date de l'événement
    photoUrls: string[]; // URLs des images stockées
    createdAt: Timestamp; // Date de création du document
    userId: string; // ID de l'utilisateur qui a créé la publication
    userDisplayName?: string; // Nom d'affichage de l'utilisateur
}
