/* eslint-disable @next/next/no-img-element -- ticket QR is a per-request data URL. */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import QRCode from "qrcode";
import Link from "next/link";
import PaymentProofForm from "@/components/public/PaymentProofForm";
import PrintButton from "@/components/public/PrintButton";
import FeedbackForm from "@/components/public/FeedbackForm";
import CancelRegistrationButton from "@/components/public/CancelRegistrationButton";

export const dynamic = "force-dynamic";

export default async function RegistrationDetailPage({ params }) {
  const session = await auth();
  const { id } = await params;
  if (!session) redirect(`/login?callbackUrl=/my-registrations/${id}`);
  const registration = await prisma.registration.findUnique({ where: { id }, include: { event: true, refundRequests: { orderBy: { requestedAt: "desc" }, take: 1 } } });
  if (!registration || (registration.userId !== session.user.id && registration.userData?.userId !== session.user.id)) notFound();
  const attendance = await prisma.eventAttendance.findUnique({ where: { userId_eventId: { userId: session.user.id, eventId: registration.eventId } } });
  const feedback = attendance ? await prisma.eventFeedback.findUnique({ where: { userId_eventId: { userId: session.user.id, eventId: registration.eventId } } }) : null;
  const qr = registration.status === "active" && registration.ticketCode && registration.paymentStatus === "paid" ? await QRCode.toDataURL(`GGF-TICKET:${registration.ticketCode}`, { margin: 1, width: 240 }) : null;

  return <div className="py-12 bg-gray-50 min-h-screen"><div className="container-custom max-w-3xl">
    <Link href="/my-registrations" className="text-primary text-sm">← All registrations</Link>
    <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 mt-4 print:shadow-none">
      <div className="flex flex-wrap justify-between gap-4 border-b pb-6"><div><p className="text-sm text-primary font-semibold">GGF EVENT REGISTRATION</p><h1 className="text-2xl font-bold mt-1">{registration.event.title}</h1><p className="text-gray-500">Submitted {formatDateTime(registration.createdAt)}</p></div><span className={`h-fit px-3 py-1 rounded-full text-sm ${registration.status === "cancelled" ? "bg-gray-100 text-gray-700" : registration.paymentStatus === "paid" ? "bg-green-100 text-green-700" : registration.paymentStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>{registration.status === "cancelled" ? "Cancelled" : registration.event.isPaid ? `Payment ${registration.paymentStatus}` : "Confirmed"}</span></div>
      <div className="grid sm:grid-cols-2 gap-6 py-6"><div><p className="text-xs text-gray-500">Registration number</p><p className="font-mono font-bold">{registration.registrationNumber || registration.id}</p></div><div><p className="text-xs text-gray-500">Attendance</p><p className="font-semibold">{attendance ? `Checked in ${formatDateTime(attendance.checkedInAt)}` : "Not checked in"}</p></div><div><p className="text-xs text-gray-500">Participant</p><p className="font-semibold">{registration.userData?.firstName} {registration.userData?.middleName} {registration.userData?.surname}</p></div><div><p className="text-xs text-gray-500">Venue</p><p className="font-semibold">{registration.event.venue || "To be announced"}</p></div></div>
      {registration.paymentStatus === "pending" && <div className="bg-yellow-50 text-yellow-900 rounded-xl p-4 mb-6"><p className="font-semibold">Manual verification in progress</p><p className="text-sm mt-1">The GGF team will review your screenshot and transaction reference. You will receive an in-app update after review.</p></div>}
      {registration.paymentStatus === "rejected" && <div className="bg-red-50 rounded-xl p-5 mb-6"><p className="font-semibold text-red-800">Payment proof needs attention</p><p className="text-sm text-red-700 mt-1">{registration.rejectionReason || "Please submit a clearer or corrected payment proof."}</p><div className="mt-4"><PaymentProofForm registrationId={registration.id}/></div></div>}
      {registration.refundRequests[0] && <div className="bg-blue-50 rounded-xl p-4 mb-6"><p className="font-semibold">Refund: {registration.refundRequests[0].status}</p><p className="text-sm mt-1">Your paid cancellation is tracked by the finance team.{registration.refundRequests[0].reference ? ` Reference: ${registration.refundRequests[0].reference}` : ""}</p></div>}
      {qr && <div className="text-center border-t pt-6"><img src={qr} alt="Entry ticket QR code" className="w-52 h-52 mx-auto"/><p className="font-semibold">Entry ticket</p><p className="text-sm text-gray-500">Present this QR code at check-in. Do not share it.</p></div>}
      <div className="flex flex-wrap gap-3 border-t mt-6 pt-6 print:hidden"><PrintButton/>{registration.status === "active" && <><a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(registration.event.title)}&dates=${registration.event.eventDate ? `${new Date(registration.event.eventDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(new Date(registration.event.eventDate).getTime() + 7200000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}` : ''}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary text-white rounded-lg">Add to calendar</a><CancelRegistrationButton registrationId={registration.id} isPaid={registration.event.isPaid && registration.paymentStatus === "paid"}/></>}</div>
      {attendance && <FeedbackForm eventId={registration.eventId} existing={feedback}/>} 
    </div>
  </div></div>;
}
