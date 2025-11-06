import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, TrendingUp, TrendingDown, ArrowRight, ArrowLeft } from "lucide-react"

export default async function WalletPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      *,
      from_profile:profiles!transactions_from_user_fkey(full_name),
      to_profile:profiles!transactions_to_user_fkey(full_name)
    `,
    )
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50)

  const totalEarned =
    transactions?.filter((t) => t.to_user === user.id).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

  const totalSpent =
    transactions?.filter((t) => t.from_user === user.id).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isIncome = (transaction: any) => transaction.to_user === user.id

  const getTransactionDescription = (transaction: any) => {
    const isReceived = transaction.to_user === user.id
    const otherUser = isReceived ? transaction.from_profile?.full_name : transaction.to_profile?.full_name

    if (isReceived) {
      return `Received from ${otherUser || "Unknown"}`
    } else {
      return `Paid to ${otherUser || "Unknown"}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600">Manage your credits and view transaction history</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-2 border-teal-200 bg-teal-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Balance</CardTitle>
              <Coins className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{profile?.credits || 0}</div>
              <p className="text-xs text-gray-500">Credits available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{totalEarned}</div>
              <p className="text-xs text-gray-500">Credits received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{totalSpent}</div>
              <p className="text-xs text-gray-500">Credits paid out</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction: any) => {
                  const income = isIncome(transaction)
                  return (
                    <div
                      key={transaction.id}
                      className={`flex items-start justify-between rounded-lg border-l-4 p-4 ${
                        income ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${income ? "bg-green-100" : "bg-red-100"}`}>
                          {income ? (
                            <ArrowLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{getTransactionDescription(transaction)}</p>
                          {transaction.task_title && (
                            <p className="text-sm text-gray-600">For: {transaction.task_title}</p>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                            {transaction.reward_type && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.reward_type === "credits" ? "Credits" : "Cash"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${income ? "text-green-600" : "text-red-600"}`}>
                          {income ? "+" : "-"}
                          {Math.abs(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500">credits</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
                <Coins className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="mt-1 text-sm text-gray-400">Complete tasks to start earning credits!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
