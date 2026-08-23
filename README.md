# Friendly Message

If you are reading this, it means you've taken a peek behind the curtain and viewed the source code of my portfolio at [asem-sharif-ai.github.io](https://asem-sharif-ai.github.io/). 

The repository for this entire setup can be found here (for sharing):
**Repository:** [github.com/asem-sharif-ai/asem-sharif-ai.github.io](https://github.com/asem-sharif-ai/asem-sharif-ai.github.io)

---

### Modular & Reusable Design
I intentionally designed this portfolio to be completely clean, modular, and template-driven. **None of my personal information, links, paths, or layouts are hardcoded into the structural files.** This means the entire portfolio system can be adapted, customized, and reused easily by anyone who likes the minimal design.

---

### How to Make it Yours

You don't need to rewrite the core JavaScript logic or alter the HTML structure. To spin up your own version, you only need to look at two places:

1. **Check the Mapping Dictionaries (`base.js`)**:
   At the very beginning of `base.js`, you'll find three maps:
   * `symbolMap`: For controlling the primary text/symbol logo in the navigation header.
   * `iconMap`: Maps card icons using standard FontAwesome classes.
   * `iconMap`: Maps social media platform identifiers to their respective FontAwesome brand/solid icons.
   
   Feel free to look over these keys to see what identifiers are supported out of the box!

2. **Configure the Project Properties (`config.json`)**:
   This is the control center of your portfolio. Drop in your own values for your name, roles, location, social links, paths to your files (`README.md`, resumes, status logs), and custom accent hues.
   
   **Important Note:** *Make sure the file name remains strictly `config.json` without any modifications, as the underlying application relies on fetching this exact file resource on boot.*

---

Thank you for exploring the source. If you decide to fork it or use it for your own page, enjoy creating with it.
- **Asem Sharif.**