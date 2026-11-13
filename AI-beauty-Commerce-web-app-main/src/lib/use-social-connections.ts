import {useCallback,useEffect,useRef,useState} from 'react';
import {apiFetch} from './owned-api';
export type SocialProvider='tiktok'|'instagram';
type Link={provider:SocialProvider;handle:string;profileUrl:string;verified:false};
export function useSocialConnections(userId?:string){
 const [links,setLinks]=useState<Link[]>([]),[error,setError]=useState(''),[saving,setSaving]=useState(false);const owner=useRef(userId),statusOwner=useRef<string|undefined>(undefined);owner.current=userId;const readRevision=useRef(0),inFlight=useRef<string|undefined>(undefined);
 const refresh=useCallback(async()=>{if(!userId)return;const revision=++readRevision.current;const result=await apiFetch<{links:Link[]}>('/api/creator/social-links');if(owner.current===userId&&revision===readRevision.current){statusOwner.current=userId;setLinks(result.links);}},[userId]);
 useEffect(()=>{owner.current=userId;statusOwner.current=undefined;setLinks([]);setError('');setSaving(false);void refresh().catch(reason=>{if(owner.current===userId)setError(reason.message);});return()=>{owner.current=undefined;readRevision.current++;};},[refresh,userId]);
 async function save(provider:SocialProvider,profileUrl:string|null){if(!userId||inFlight.current===userId)return false;const target=userId;inFlight.current=target;setSaving(true);setError('');try{await apiFetch('/api/creator/social-links',{method:'POST',body:JSON.stringify({provider,profileUrl})});if(owner.current!==target)return false;await refresh();return true;}catch(reason){if(owner.current===target)setError(reason instanceof Error?reason.message:'Could not save profile link.');return false;}finally{if(inFlight.current===target)inFlight.current=undefined;if(owner.current===target)setSaving(false);}}
 function account(provider:SocialProvider){const profile=statusOwner.current===userId?links.find(link=>link.provider===provider):undefined;return{saved:Boolean(profile),handle:profile?.handle||'',profileUrl:profile?.profileUrl||'',followers:'',verified:false};}
 return{account,error,saving,save,disconnect:(provider:SocialProvider)=>save(provider,null)};
}
