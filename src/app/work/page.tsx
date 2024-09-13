export default function Work() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Work Experience</h1>
      <p className="mb-4">For my career, I follow the advice of Charlie Munger:</p>
      <p className="mb-4">&quot;You want to deliver to the world what you would buy if you were on the other end.&quot;</p>
      
      <ul className="list-disc pl-5 mb-6 space-y-2">
        <li><a href="https://github.com/BYU-PCCL" className="hover:text-[#e97319] work-link">PCC Lab</a> (May 2024-Present): AI Research Assistant
          <ul className="list-disc pl-5 mt-1">
            <li>I research sparse autoencoders, interpretability, and hallucinations in the context of AI safety.</li>
          </ul>
        </li>
        <li><a href="https://getcartwheel.com/home" className="hover:text-[#e97319] work-link">Cartwheel</a> (June 2024-September 2024): Data Labeler
          <ul className="list-disc pl-5 mt-1">
            <li>Gained interesting insights into the training of foundation models with specialized datasets. Motion data is fascinating!</li>
          </ul>
        </li>
        <li><a href="https://www.gosameday.com" className="hover:text-[#e97319] work-link">Sameday</a> (May 2022-Oct 2023): Cofounder & CTO
          <ul className="list-disc pl-5 mt-1">
            <li>Engineered an AI phone agent that handled 4000+ calls monthly and successfully went through YCombinator and AI grant.</li>
          </ul>
        </li>
        <li><a href="https://junilearning.com" className="hover:text-[#e97319] work-link">Juni Learning</a> (May 2022-Oct 2022): Computer Science Tutor
          <ul className="list-disc pl-5 mt-1">
            <li>Mentored 4 students (ages 8-16) for 8+ months in computer science, advancing one from Python basics to mastering complex algorithms like merge sort.</li>
          </ul>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Projects</h2>
      <ul className="list-disc pl-5 mb-6">
        <li><a href="https://github.com/max4c/m4c2" className="hover:text-[#e97319] work-link">maxforsey.com</a> (Ongoing): This website has become so much fun to work on and to experiment with design principles. It&apos;s also how I learned next.js and tailwind CSS!</li>
      </ul>
      <ul className="list-disc pl-5 mb-6">
        <li><a href="https://github.com/max4c/freshsesh" className="hover:text-[#e97319] work-link">FreshSesh AI</a> (March 2024): a macOS menu bar tool that summarizes recent git commits using a local LLM. 
        It also won <a href="https://www.linkedin.com/posts/max-forsey_byu-acm-yhack-activity-7173389362913533952-YpAS?utm_source=share&utm_medium=member_desktop" className="hover:text-[#e97319] work-link">Best 1 Person Team</a> 
        at BYU&apos;s YHack hackathon.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Skills</h2>
      <ul className="list-disc pl-5 mb-6 space-y-2">
        <li>Languages: Python, Java, Node.js, C++, JavaScript, CSS, HTML</li>
        <li>Databases: MySQL, NoSQL, Firebase</li>
        <li>Machine Learning & LLM: PyTorch, NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn</li>
        <li>Misc: Linear, Ollama, Notion, Twilio, Github, GCP, Eagle Scout, Crucial Conversations</li>
      </ul>

      <p className="mb-4">Interested in working with me?</p>
      <p>Reach out at hello[at]maxforsey[dot]com</p>
      <br></br>
    </div>
  );
}