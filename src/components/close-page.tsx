"use client";
import { useRouter } from "next/navigation";
import BoardPopupActions from "@/components/board-popup-actions";
export default function ClosePage({listHref="/instruments",listLabel="계측기 대장"}:{listHref?:string;listLabel?:string}){return <BoardPopupActions listHref={listHref} listLabel={listLabel}/>}
