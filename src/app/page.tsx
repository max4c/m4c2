import Image from "next/image";

export default function Home() {
  return (
    <div className="border max-w-screen-lg m-auto">
        <div className="profile-section">
            <div className="profile-text">
                <p>
                    I currently live in Utah and study CS and AI at BYU.
                </p>
                <p>
                    I grew up in Arizona and previously cofounded
                    <a href="https://www.gosameday.com">Sameday AI</a>. <br /><br />
                </p>

                <p>Email: hello[at]maxforsey[dot]com<br /><br /></p>

                <p>A few things about me</p>
                <p></p>
                <ul className = "list-inside list-disc">
                    <li>
                        I'm a student, programmer, philhellene, and longevity enthusiast.
                    </li>
                    <li>
                        I've been an entrepreneur, translator, missionary, and soloist.
                    </li>
                    <li>
                        Interests include knowledge management, AI,
                        metalearning, lifestyle design, urban planning,
                        sustainability, and movement.
                        <ul>
                            <li>
                                yoga, weightlifting, running, hiking, etc. I
                                love it all.
                            </li>
                        </ul>
                    </li>
                </ul>
                <br />
                <h4>Elsewhere</h4>
                <p>
                    <a href="https://github.com/max4c">max4c</a> on GitHub;
                    <a href="https://www.youtube.com/channel/UCbxSpKpe9q0dZkJ1jkHWdEg">Max Forsey</a>
                    on Youtube;
                </p>
            </div>
        </div>  
    </div>
  )
}
