import { Component } from "@angular/core";

@Component({
    selector: "app-techniques-agroeco",
    imports: [],
    templateUrl: "./techniques-agroeco.component.html",
    styleUrl: "./techniques-agroeco.component.scss",
})
export class TechniquesAgroecoComponent {
    techniques = [
        {
            titre: "Le Compostage",
            description: `Le compostage permet de recycler les déchets organiques pour créer un amendement naturel riche en nutriments qui améliore la structure du sol.`,
            image: "images/IMG-20250508-WA0014.jpg",
            alt: "Technique de compostage",
        },
        {
            titre: "L'Agroforesterie",
            description: `Intégration des arbres dans les systèmes agricoles pour améliorer la fertilité des sols, fournir de l'ombre et créer des microclimats favorables.`,
            image: "images/IMG-20250508-WA0016.jpg",
            alt: "Système agroforestier",
        },
        {
            titre: "Rotation des Cultures",
            description: `La rotation planifiée des cultures permet de rompre les cycles des ravageurs, de réduire les maladies et d'améliorer la structure du sol.`,
            image: "images/IMG-20250508-WA0012.jpg",
            alt: "Rotation des cultures",
        },
        {
            titre: "Conservation de l'Eau",
            description: `Techniques de collecte et de gestion de l'eau adaptées aux conditions climatiques changeantes en Afrique de l'Ouest.`,
            image: "images/IMG-20250508-WA0020.jpg",
            alt: "Conservation de l'eau",
        },
    ];
}
