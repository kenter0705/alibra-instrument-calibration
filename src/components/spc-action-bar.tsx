"use client";
import {Children,cloneElement,isValidElement,useState,type MouseEvent,type ReactNode} from "react";
type ActionProps={onClick?:(event:MouseEvent<HTMLElement>)=>void;"data-active"?:boolean};
export default function SpcActionBar({children,className=""}:{children:ReactNode;className?:string}){const [active,setActive]=useState<number|null>(null);return <div className={"spc-function-bar spc-data-library-actions "+className}>{Children.map(children,(child,index)=>{if(!isValidElement<ActionProps>(child)||typeof child.type!=="string"||!["button","a","label"].includes(child.type))return child;return cloneElement(child,{"data-active":active===index,onClick:event=>{setActive(index);child.props.onClick?.(event)}})})}</div>}
