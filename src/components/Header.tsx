import Link from "next/link";
export default function Header(){return <header className="header"><div className="container header-inner"><Link href="/" className="brand">NBA <span>Fantasy Lab</span></Link><nav className="nav"><Link href="/">Players</Link><span>Rankings</span><span>My Team</span></nav></div></header>}
