import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Coins, Users, Zap, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <span className="text-xl font-bold text-teal-600">TaskTrove</span>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 sm:text-6xl">
              Campus Errands Made <span className="text-teal-600">Simple</span>
            </h1>
            <p className="mb-8 text-xl leading-relaxed text-gray-600">
              Post tasks, help others, and earn credits. TaskTrove connects students for quick errands, tutoring,
              deliveries, and more.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700">
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Login</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Sign Up</h3>
                  <p className="text-sm text-gray-600">Create your account and get 100 free credits to start</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Post or Browse</h3>
                  <p className="text-sm text-gray-600">Post tasks you need help with or browse available errands</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Coins className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Earn Credits</h3>
                  <p className="text-sm text-gray-600">Complete tasks and earn credits or cash rewards</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Stay Safe</h3>
                  <p className="text-sm text-gray-600">Built-in chat and secure transactions for peace of mind</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-teal-600 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to Get Started?</h2>
            <p className="mb-8 text-xl text-teal-100">Join TaskTrove today and start helping your campus community</p>
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
              <Link href="/auth/signup">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-gray-600">
          <p>&copy; 2025 TaskTrove. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
