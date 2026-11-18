const COPY = {
  local: {
    title: "Ghana's event vendors, properly introduced",
    body: "Every listing reviewed and approved before it appears. Weddings, parties, conferences and funerals.",
    switchPrompt: "Planning from outside Ghana?",
    switchTo: "abroad",
  },
  abroad: {
    title: "Book Ghana's best event vendors from anywhere",
    body: "Planning a wedding, funeral or celebration back home? Every vendor is reviewed before listing, and you can compare and contact them from wherever you are.",
    switchPrompt: "Based in Ghana?",
    switchTo: "local",
  },
};

export default function HomeMasthead({ audience = "local", onAudienceChange }) {
  const copy = COPY[audience] || COPY.local;
  return (
    <section className="text-center pt-8 md:pt-16 pb-6 md:pb-10 px-5 md:px-10">
      <h1 className="font-serif text-[32px] md:text-[52px] leading-[1.1] text-ink dark:text-[#F1E8E0] max-w-[760px] mx-auto">
        {copy.title}
      </h1>
      <p className="mt-4 font-light text-[15px] leading-[1.6] text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)] max-w-[560px] mx-auto">
        {copy.body}
      </p>
      {onAudienceChange && (
        <p className="mt-3 text-[12.5px] font-light text-[rgba(59,50,43,0.55)] dark:text-[rgba(241,232,224,0.55)]">
          {copy.switchPrompt}{" "}
          <button
            type="button"
            onClick={() => onAudienceChange(copy.switchTo)}
            className="underline underline-offset-2 text-gold-text dark:text-gold-dark hover:text-ink dark:hover:text-[#F1E8E0]"
          >
            {copy.switchTo === "abroad" ? "See Khareus for planning from abroad" : "See Khareus for Ghana"}
          </button>
        </p>
      )}
    </section>
  );
}
