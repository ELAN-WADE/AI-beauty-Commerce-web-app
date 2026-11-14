'use client';

import React from 'react';
import {
  Layout,
  SquaresFour,
  ShoppingBag,
  CreditCard,
  Coins,
  Stack,
  ShieldCheck,
  MagnifyingGlass,
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  ArrowUpRight,
  TrendUp,
  TrendDown,
  CheckCircle,
  XCircle,
  Warning,
  WarningCircle,
  CircleNotch,
  MapPin,
  ArrowsClockwise,
  ArrowCounterClockwise,
  SignOut,
  Gear,
  ArrowSquareOut,
  Funnel,
  FileXls,
  Buildings,
  CurrencyDollar,
  Package,
  Plus,
  Minus,
  PencilSimple,
  Eye,
  SlidersHorizontal,
  Sliders,
  ArrowRight,
  ArrowsLeftRight,
  Tag,
  Check,
  Truck,
  UserCheck,
  Star,
  Medal,
  ShareNetwork,
  User,
  UsersThree,
  Heartbeat,
  ChatCircleText,
  Palette,
  Globe,
  Trash,
  Gift,
  VideoCamera,
  PaperPlaneTilt,
  Flask,
  Image as PhosphorImage,
  UploadSimple,
  Clock,
  Lock,
  Copy,
  QrCode,
  Sparkle,
  Megaphone,
  Wallet,
  Heart,
  Monitor,
  DeviceMobile,
  Headset,
  Ticket,
  Storefront,
  FileText,
  Crown,
  Pulse,
  DownloadSimple,
  ArrowLeft as PhosphorArrowLeft,
  ArrowsDownUp,
  ChartBar,
  BookOpen as PhosphorBookOpen,
  Camera as PhosphorCamera,
  Drop,
  EyeSlash,
  SealCheck,
  FilmStrip,
  Fire,
  GridFour,
  Question,
  InstagramLogo,
  Key,
  LinkSimple,
  SignIn,
  EnvelopeSimple,
  ArrowsOut,
  List,
  ChatCircleDots,
  DotsThree,
  DotsThreeVertical,
  MusicNote,
  NavigationArrow,
  Percent as PhosphorPercent,
  Phone as PhosphorPhone,
  PhoneCall as PhosphorPhoneCall,
  Play as PhosphorPlay,
  PlusCircle as PhosphorPlusCircle,
  Printer as PhosphorPrinter,
  Quotes,
  FloppyDisk,
  Scan as PhosphorScan,
  Shield as PhosphorShield,
  Sun as PhosphorSun,
  CaretUp,
} from '@phosphor-icons/react';

export interface SolidIconProps {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  fill?: string;
  color?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

type PhosphorComp = React.ComponentType<{
  size?: number | string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  className?: string;
  color?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}>;

function makeSolid(Icon: PhosphorComp, weight: 'fill' | 'bold' = 'fill', defaultSize = 18) {
  const Wrapped: React.FC<SolidIconProps> = ({
    size,
    className = '',
    color,
    'aria-hidden': ariaHidden = true,
    onClick,
  }) => (
    <Icon
      size={size ?? (className.includes('w-') || className.includes('h-') ? '1em' : defaultSize)}
      weight={weight}
      color={color}
      className={`shrink-0 ${className}`.trim()}
      aria-hidden={ariaHidden}
      onClick={onClick}
    />
  );
  return Wrapped;
}

export const LayoutGrid = makeSolid(SquaresFour, 'fill');
export const LayoutDashboard = makeSolid(Layout, 'fill');
export const ShoppingBagIcon = makeSolid(ShoppingBag, 'fill');
export { ShoppingBagIcon as ShoppingBag };
export const CreditCardIcon = makeSolid(CreditCard, 'fill');
export { CreditCardIcon as CreditCard };
export const CoinsIcon = makeSolid(Coins, 'fill');
export { CoinsIcon as Coins };
export const Boxes = makeSolid(Stack, 'fill');
export const Layers = makeSolid(Stack, 'fill');
export const ShieldCheckIcon = makeSolid(ShieldCheck, 'fill');
export { ShieldCheckIcon as ShieldCheck };
export const ShieldAlert = makeSolid(Warning, 'fill');
export const Search = makeSolid(MagnifyingGlass, 'bold');
export const BellIcon = makeSolid(Bell, 'fill');
export { BellIcon as Bell };
export const ChevronDown = makeSolid(CaretDown, 'bold');
export const ChevronLeft = makeSolid(CaretLeft, 'bold');
export const ChevronRight = makeSolid(CaretRight, 'bold');
export const ArrowUpRightIcon = makeSolid(ArrowUpRight, 'bold');
export { ArrowUpRightIcon as ArrowUpRight };
export const ArrowRightIcon = makeSolid(ArrowRight, 'bold');
export { ArrowRightIcon as ArrowRight };
export const ArrowRightLeft = makeSolid(ArrowsLeftRight, 'bold');
export const TrendingUp = makeSolid(TrendUp, 'bold');
export const TrendingDown = makeSolid(TrendDown, 'bold');
export const CheckCircle2 = makeSolid(CheckCircle, 'fill');
export const CheckCircleIcon = makeSolid(CheckCircle, 'fill');
export { CheckCircleIcon as CheckCircle };
export const XCircleIcon = makeSolid(XCircle, 'fill');
export { XCircleIcon as XCircle };
export const AlertTriangle = makeSolid(Warning, 'fill');
export const AlertCircle = makeSolid(WarningCircle, 'fill');
export const ClockIcon = makeSolid(Clock, 'fill');
export { ClockIcon as Clock };
export const Loader2: React.FC<SolidIconProps> = ({ size = 16, className = '' }) => (
  <CircleNotch size={size} weight="bold" className={`shrink-0 animate-spin ${className}`.trim()} aria-hidden={true} />
);
export const MapPinIcon = makeSolid(MapPin, 'fill');
export { MapPinIcon as MapPin };
export const RefreshCw = makeSolid(ArrowsClockwise, 'bold');
export const RotateCcw = makeSolid(ArrowCounterClockwise, 'bold');
export const LogOut = makeSolid(SignOut, 'fill');
export const Settings = makeSolid(Gear, 'fill');
export const ExternalLink = makeSolid(ArrowSquareOut, 'fill');
export const Filter = makeSolid(Funnel, 'fill');
export const FileSpreadsheet = makeSolid(FileXls, 'fill');
export const FileTextIcon = makeSolid(FileText, 'fill');
export { FileTextIcon as FileText };
export const Building2 = makeSolid(Buildings, 'fill');
export const Store = makeSolid(Storefront, 'fill');
export const DollarSign = makeSolid(CurrencyDollar, 'bold');
export const PackageIcon = makeSolid(Package, 'fill');
export { PackageIcon as Package };
export const PlusIcon = makeSolid(Plus, 'bold');
export { PlusIcon as Plus };
export const MinusIcon = makeSolid(Minus, 'bold');
export { MinusIcon as Minus };
export const X = makeSolid(XCircle, 'fill');
export const Edit2 = makeSolid(PencilSimple, 'fill');
export const EyeIcon = makeSolid(Eye, 'fill');
export { EyeIcon as Eye };
export const SlidersHorizontalIcon = makeSolid(SlidersHorizontal, 'fill');
export { SlidersHorizontalIcon as SlidersHorizontal };
export const SlidersIcon = makeSolid(Sliders, 'fill');
export { SlidersIcon as Sliders };
export const TagIcon = makeSolid(Tag, 'fill');
export { TagIcon as Tag };
export const CheckIcon = makeSolid(Check, 'bold');
export { CheckIcon as Check };
export const TruckIcon = makeSolid(Truck, 'fill');
export { TruckIcon as Truck };
export const UserCheckIcon = makeSolid(UserCheck, 'fill');
export { UserCheckIcon as UserCheck };
export const UserIcon = makeSolid(User, 'fill');
export { UserIcon as User };
export const Users = makeSolid(UsersThree, 'fill');
export const StarIcon = makeSolid(Star, 'fill');
export { StarIcon as Star };
export const Award = makeSolid(Medal, 'fill');
export const Share2 = makeSolid(ShareNetwork, 'fill');
export const HeartPulse = makeSolid(Heartbeat, 'fill');
export const MessageSquare = makeSolid(ChatCircleText, 'fill');
export const PaletteIcon = makeSolid(Palette, 'fill');
export { PaletteIcon as Palette };
export const GlobeIcon = makeSolid(Globe, 'fill');
export { GlobeIcon as Globe };
export const Trash2 = makeSolid(Trash, 'fill');
export const GiftIcon = makeSolid(Gift, 'fill');
export { GiftIcon as Gift };
export const Video = makeSolid(VideoCamera, 'fill');
export const Send = makeSolid(PaperPlaneTilt, 'fill');
export const FlaskConical = makeSolid(Flask, 'fill');
export const Image = makeSolid(PhosphorImage, 'fill');
export const ImageIcon = makeSolid(PhosphorImage, 'fill');
export const Upload = makeSolid(UploadSimple, 'fill');
export const LockIcon = makeSolid(Lock, 'fill');
export { LockIcon as Lock };
export const CopyIcon = makeSolid(Copy, 'fill');
export { CopyIcon as Copy };
export const QrCodeIcon = makeSolid(QrCode, 'fill');
export { QrCodeIcon as QrCode };
export const Sparkles = makeSolid(Sparkle, 'fill');
export const MegaphoneIcon = makeSolid(Megaphone, 'fill');
export { MegaphoneIcon as Megaphone };
export const WalletIcon = makeSolid(Wallet, 'fill');
export { WalletIcon as Wallet };
export const HeartIcon = makeSolid(Heart, 'fill');
export { HeartIcon as Heart };
export const MonitorIcon = makeSolid(Monitor, 'fill');
export { MonitorIcon as Monitor };
export const Smartphone = makeSolid(DeviceMobile, 'fill');
export const Headphones = makeSolid(Headset, 'fill');
export const TicketIcon = makeSolid(Ticket, 'fill');
export { TicketIcon as Ticket };
export const CrownIcon = makeSolid(Crown, 'fill');
export { CrownIcon as Crown };
export const Activity = makeSolid(Pulse, 'bold');
export const ArrowDownToLine = makeSolid(DownloadSimple, 'fill');
export const ArrowLeft = makeSolid(PhosphorArrowLeft, 'bold');
export const ArrowUpDown = makeSolid(ArrowsDownUp, 'bold');
export const BarChart2 = makeSolid(ChartBar, 'fill');
export const BookOpen = makeSolid(PhosphorBookOpen, 'fill');
export const Building = makeSolid(Buildings, 'fill');
export const Camera = makeSolid(PhosphorCamera, 'fill');
export const ChevronUp = makeSolid(CaretUp, 'bold');
export const Download = makeSolid(DownloadSimple, 'fill');
export const Droplet = makeSolid(Drop, 'fill');
export const EyeOff = makeSolid(EyeSlash, 'fill');
export const FileCheck = makeSolid(SealCheck, 'fill');
export const Film = makeSolid(FilmStrip, 'fill');
export const Flame = makeSolid(Fire, 'fill');
export const Grid3X3 = makeSolid(GridFour, 'fill');
export const HelpCircle = makeSolid(Question, 'fill');
export const Instagram = makeSolid(InstagramLogo, 'fill');
export const KeyRound = makeSolid(Key, 'fill');
export const LinkIcon = makeSolid(LinkSimple, 'bold');
export { LinkIcon as Link };
export const Link2 = makeSolid(LinkSimple, 'bold');
export const LogIn = makeSolid(SignIn, 'bold');
export const Mail = makeSolid(EnvelopeSimple, 'fill');
export const Maximize2 = makeSolid(ArrowsOut, 'bold');
export const Menu = makeSolid(List, 'bold');
export const MessageCircle = makeSolid(ChatCircleDots, 'fill');
export const MoreHorizontal = makeSolid(DotsThree, 'bold');
export const MoreVertical = makeSolid(DotsThreeVertical, 'bold');
export const Music = makeSolid(MusicNote, 'fill');
export const Navigation = makeSolid(NavigationArrow, 'fill');
export const PackageCheck = makeSolid(Package, 'fill');
export const Percent = makeSolid(PhosphorPercent, 'bold');
export const Phone = makeSolid(PhosphorPhone, 'fill');
export const PhoneCall = makeSolid(PhosphorPhoneCall, 'fill');
export const Play = makeSolid(PhosphorPlay, 'fill');
export const PlusCircle = makeSolid(PhosphorPlusCircle, 'fill');
export const Printer = makeSolid(PhosphorPrinter, 'fill');
export const Quote = makeSolid(Quotes, 'fill');
export const Save = makeSolid(FloppyDisk, 'fill');
export const Scan = makeSolid(PhosphorScan, 'bold');
export const Shield = makeSolid(PhosphorShield, 'fill');
export const Sun = makeSolid(PhosphorSun, 'fill');
