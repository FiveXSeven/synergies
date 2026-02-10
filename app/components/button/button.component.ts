import { Component, Input } from "@angular/core";

@Component({
    selector: "app-button",
    standalone: true,
    imports: [],
    templateUrl: "./button.component.html",
    styleUrl: "./button.component.scss",
})
export class ButtonComponent {
    @Input() title: string = "";
    @Input() audioSrc?: string;

    isPlaying = false;
    private audio: HTMLAudioElement | null = null;

    toggleAudio() {
        if (!this.audioSrc) return;

        if (!this.audio) {
            this.audio = new Audio(this.audioSrc);
            this.audio.onended = () => {
                this.isPlaying = false;
            };
        }

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio
                .play()
                .then(() => (this.isPlaying = true))
                .catch((e) => {
                    console.error("Erreur de lecture audio", e);
                    this.isPlaying = false;
                });
        }
    }

    ngOnDestroy() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
    }
}
