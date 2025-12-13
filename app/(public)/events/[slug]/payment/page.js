import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import PaymentProofForm from "@/components/public/PaymentProofForm";

export const metadata = {
  title: "Payment - GGF Community Portal",
  description: "Complete your event registration payment.",
};

async function getRegistration(registrationId) {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
      },
    });
    return registration;
  } catch (error) {
    console.error("Failed to fetch registration:", error);
    return null;
  }
}

export default async function PaymentPage({ params, searchParams }) {
  const { slug } = await params;
  const { registrationId } = await searchParams;

  if (!registrationId) {
    redirect(`/events/${slug}`);
  }

  const registration = await getRegistration(registrationId);

  if (!registration || registration.event.slug !== slug) {
    notFound();
  }

  if (!registration.event.isPaid) {
    redirect(`/events/${slug}`);
  }

  if (registration.paymentStatus === 'paid') {
    return (
      <div className="py-12">
        <div className="container-custom">
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified!</h1>
            <p className="text-gray-600">
              Your payment has been verified and your registration is complete.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>
            <p className="text-gray-600 mb-6">
              Please complete the payment for <strong>{registration.event.title}</strong>
            </p>

            {/* UPI QR Code */}
            {registration.event.upiQrImage && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
                <p className="text-sm text-gray-600 mb-4">Scan the QR code to pay via UPI</p>
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <Image
                    src={registration.event.upiQrImage}
                    alt="UPI QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Payment Status */}
            {registration.paymentStatus === 'pending' && registration.paymentSs && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  <strong>Payment proof submitted!</strong> We are verifying your payment. 
                  You will be notified once it's confirmed.
                </p>
              </div>
            )}

            {/* Payment Proof Form */}
            {!registration.paymentSs && (
              <PaymentProofForm registrationId={registration.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
