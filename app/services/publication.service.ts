import { Injectable } from "@angular/core";
import {
    Firestore,
    collection,
    addDoc,
    Timestamp,
    serverTimestamp, // Pour la date de création côté serveur
    CollectionReference, // Importez CollectionReference pour typer votre collection
    // DocumentData // Vous pouvez l'utiliser si vous ne typez pas fortement avec Publication
} from "@angular/fire/firestore";
import {
    Storage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
} from "@angular/fire/storage";
import { Auth, onAuthStateChanged, User } from "@angular/fire/auth"; // Importez User pour typer currentUser
import { Publication } from "../models/publication.model"; // Assurez-vous que le chemin est correct

@Injectable({
    providedIn: "root",
})
export class PublicationService {
    // Déclarez la propriété sans l'initialiser ici
    private publicationsCollection: CollectionReference<
        Omit<Publication, "id">
    >; // Typez la collection
    private currentUser: User | null = null; // Typez currentUser avec User | null

    constructor(
        private firestore: Firestore,
        private storage: Storage,
        private auth: Auth // Injectez Auth
    ) {
        // Initialisez publicationsCollection ici, après que this.firestore soit disponible
        this.publicationsCollection = collection(
            this.firestore,
            "publications"
        ) as CollectionReference<Omit<Publication, "id">>;
        // Ou, si vous voulez être plus strict avec les types et que Publication correspond à la structure Firestore
        // this.publicationsCollection = collection(this.firestore, "publications") as CollectionReference<Publication>;

        // Écoutez les changements d'état d'authentification pour obtenir l'utilisateur
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.currentUser = user;
            } else {
                this.currentUser = null;
            }
        });
    }

    async addPublication(
        publicationData: Omit<
            Publication,
            "id" | "photoUrls" | "createdAt" | "userId" | "userDisplayName"
        >,
        photos: FileList
    ): Promise<any> {
        // Vous pourriez typer la promesse retournée, par ex. Promise<DocumentReference>
        if (!this.currentUser) {
            // Il serait peut-être mieux de lancer une erreur ici ou de retourner un objet d'erreur spécifique
            return Promise.reject("Utilisateur non authentifié.");
        }

        const photoUrls: string[] = [];

        // 1. Télécharger les images sur Firebase Storage
        // Utilisation de Promise.all pour télécharger les photos en parallèle
        const uploadPromises = Array.from(photos).map(async (file) => {
            const filePath = `publications/${
                this.currentUser!.uid // Utilisation de ! car on a vérifié currentUser plus haut
            }/${Date.now()}_${file.name}`;
            const storageRef = ref(this.storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, file);
            await uploadTask; // Attendre la fin du téléchargement
            return getDownloadURL(uploadTask.snapshot.ref); // Retourner l'URL de téléchargement
        });

        // Attendre que toutes les promesses de téléchargement soient résolues
        const downloadedPhotoUrls = await Promise.all(uploadPromises);
        photoUrls.push(...downloadedPhotoUrls);

        // 2. Préparer les données pour Firestore
        // Assurez-vous que eventDate est bien une instance de Date avant de la convertir
        let eventDateTimestamp: Timestamp | null = null;
        if (
            publicationData.eventDate &&
            publicationData.eventDate instanceof Date
        ) {
            eventDateTimestamp = Timestamp.fromDate(publicationData.eventDate);
        } else if (
            typeof publicationData.eventDate === "string" ||
            typeof publicationData.eventDate === "number"
        ) {
            const date = new Date(publicationData.eventDate);
            if (!isNaN(date.getTime())) {
                // Vérifier si la date est valide
                eventDateTimestamp = Timestamp.fromDate(date);
            }
        }
        // Si eventDate n'est pas fourni ou invalide, il restera null ou vous pouvez gérer l'erreur

        const publicationToSave: Omit<Publication, "id"> = {
            ...publicationData,
            photoUrls,
            userId: this.currentUser.uid, // currentUser est vérifié non null
            userDisplayName:
                this.currentUser.displayName ||
                this.currentUser.email ||
                "Utilisateur anonyme", // Fournir un fallback
            createdAt: serverTimestamp() as Timestamp,
            eventDate: eventDateTimestamp!, // Assurez-vous que eventDateTimestamp est ce que vous attendez
            // Ou gérez le cas où il pourrait être null
        };

        // 3. Ajouter le document à Firestore
        return addDoc(this.publicationsCollection, publicationToSave);
    }

    // Vous pourrez ajouter ici d'autres méthodes (getPublications, update, delete)
}
