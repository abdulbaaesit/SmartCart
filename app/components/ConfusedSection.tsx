"use client";

import React from "react";
import Chatbot from "@/app/components/Chatbot";

export default function ConfusedSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-screen-xl mx-auto bg-[#00229A] rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="text-white flex-1">
            <h2 className="text-3xl lg:text-6xl font-extrabold leading-tight">
              Confused?
            </h2>

            <p className="mt-6 text-lg lg:text-2xl font-medium leading-relaxed max-w-md">
              Not sure what you’re looking for? Our smart&nbsp;AI chatbot is
              here to help! Simply start a chat and it will guide you with
              personalised recommendations tailored to your needs. Try it now!
            </p>
          </div>

          <div className="flex-1 flex justify-center md:justify-end">
            <Chatbot />
          </div>
        </div>
      </div>
    </section>
  );
}
