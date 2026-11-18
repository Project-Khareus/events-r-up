// One honest statement about how vendors get onto Khareus, with live numbers
// from the approved listings, instead of a row of icon cards.
export default function HomeTrustStrip({ audience = "local", vendors = [], capped = false }) {
  const approved = vendors.length;
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = vendors.filter((v) => v.created_date && new Date(v.created_date).getTime() >= monthAgo).length;

  return (
    <section className="bg-ink dark:bg-[#2A231D] px-5 md:px-10 py-12 md:py-16">
      <div className="max-w-[760px]">
        <p className="text-[22px] md:text-[30px] leading-[1.3] font-medium text-cream">
          Someone on our team reads every listing before it goes live. Not everyone gets in.
        </p>
        {approved > 0 && (
          <p className="mt-4 text-[14px] md:text-[15px] text-[rgba(248,241,235,0.75)]">
            {approved}{capped ? "+" : ""} vendors approved so far
            {recent > 0 ? `, ${recent} of them in the last 30 days.` : "."}
          </p>
        )}
        <p className="mt-2 text-[14px] md:text-[15px] text-[rgba(248,241,235,0.75)]">
          {audience === "abroad"
            ? "You can message any of them on WhatsApp from wherever you are."
            : "Prices are in cedis, and every vendor lists the towns they work in."}
        </p>
      </div>
    </section>
  );
}
