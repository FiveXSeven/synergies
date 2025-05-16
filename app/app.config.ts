import {
    ApplicationConfig,
    provideZoneChangeDetection,
    LOCALE_ID,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withInMemoryScrolling({
                // Ajoutez cette fonction
                scrollPositionRestoration: "top", // Option clé pour remonter en haut
                anchorScrolling: "enabled", // Optionnel: pour gérer le défilement vers les ancres #
            })
        ),
        { provide: LOCALE_ID, useValue: "fr-FR" },
    ],
};
