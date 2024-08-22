import {
  ActionGetResponse,
  ACTIONS_CORS_HEADERS,
  ActionPostRequest,
  createPostResponse,
  ActionPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    type: "action",
    icon: new URL("/donate.png", new URL(req.url).origin).toString(),
    label: "Donate to kidscan.sol",
    description:
      "Donate to kidscan.sol",
    title: "Donate to kidscan.sol",
    links: {
      actions: [
        {
          href: "/api/actions/donate?amount=0.1",
          label: "0.1 SOL Donation",
        },
        {
          href: "/api/actions/donate?amount=0.5",
          label: "0.5 SOL Donation",
        },
        {
          href: "/api/actions/donate?amount=1.0",
          label: "1.0 SOL Donation",
        },
        {
          href: "/api/actions/donate?amount={amount}",
          label: "Donate SOL",
          parameters: [
            {
              name: "amount",
              label: "Enter a SOL donation",
            },
          ],
        },
      ],
    },
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const url = new URL(req.url);

    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw "Invalid 'account' provided. Its not a real pubkey";
    }

    let amount: number = 0.1;

    if (url.searchParams.has("amount")) {
      try {
        amount = parseFloat(url.searchParams.get("amount") || "0.1") || amount;
      } catch (err) {
        throw "Invalid 'amount' input";
      }
    }

    const connection = new Connection(clusterApiUrl("devnet"));

    const kidscan = new PublicKey("Dxz8ALRKHNCLsrNsoKbhqQorRvG22TkLsj2h6be2gWV9");

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: account,
        lamports: amount * LAMPORTS_PER_SOL,
        toPubkey: kidscan,
      }),
    );
    transaction.feePayer = account;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const simulateTransaction = await connection.simulateTransaction(transaction);
    console.log(simulateTransaction);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Thanks for the donation! - youngjazz",
      },
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;

    return Response.json(
      {
        message,
      },
      {
        headers: ACTIONS_CORS_HEADERS,
      },
    );
  }
};