import type { Contact }
from "../types/contact";

interface Props {
  contact: Contact;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ContactCard({
  contact
}: Props) {

  return (
    <article className="contact-card">

      <div className="contact-card__header">
        <div
          className="contact-card__avatar"
          aria-hidden="true"
        >
          {getInitials(contact.name)}
        </div>
        <div>
          <h3 className="contact-card__name">
            {contact.name}
          </h3>
          <p className="contact-card__title">
            {contact.title}
          </p>
        </div>
      </div>

      <p className="contact-card__location">
        {contact.location}
      </p>

      <div className="contact-card__skills">
        {
          contact.skills.map(
            skill => (
              <span
                key={skill}
                className="contact-card__skill"
              >
                {skill}
              </span>
            )
          )
        }
      </div>

    </article>
  );
}
