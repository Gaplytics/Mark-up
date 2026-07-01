"use client";

import React from "react";
import { useStateContext } from "@/context/StateContext";

export default function ToastWrapper() {
  const { toasts } = useStateContext();

  return (
    <div className="toast-wrap" id="toastWrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || ""}`}>
          <div>
            {t.title && <b>{t.title}</b>}
            {t.msg}
          </div>
        </div>
      ))}
    </div>
  );
}
