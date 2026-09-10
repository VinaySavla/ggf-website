import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import MatchManager from "@/components/admin/MatchManager";

export const dynamic="force-dynamic";
export default async function TournamentOperationsPage({params}){const session=await auth();const{id}=await params;if(!session)redirect("/login");const tournament=await prisma.tournamentMaster.findUnique({where:{id},include:{event:true,teams:true,matches:{include:{homeTeam:true,awayTeam:true,winningTeam:true},orderBy:{scheduledAt:"asc"}}}});if(!tournament)notFound();if(session.user.role!=="SUPER_ADMIN"&&tournament.organizerId!==session.user.id)redirect("/admin");return <div><h1 className="text-2xl font-bold">{tournament.event.title}</h1><p className="text-gray-600 mt-1 mb-6">Fixtures, scores and results</p><MatchManager tournament={tournament}/></div>}
