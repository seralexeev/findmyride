export type KomootParsedData = {
    page: Page;
    kmtx: Kmtx;
};

interface Kmtx {
    session: Session;
    screen: Screen;
}

interface Screen {
    location: Location;
    referrer: null;
    title: string;
    description: string;
    canonical: null;
    og_url: string;
    og_images: string[];
    og_description: string;
    ios: Ios;
    twitter: Ios;
    above_the_fold_type: string;
    robots: string;
    header: boolean;
    iframe_embed: boolean;
    fullsize: boolean;
    class_name: string;
    _links: Links;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Links {}

interface Ios {
    app_url: string;
}

interface Location {
    hash: string;
    host: string;
    hostname: string;
    href: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    query: Query;
    params: Params;
    origin: string;
}

interface Params {
    id: string;
}

interface Query {
    share_token: string;
    profile: string;
}

interface Session {
    lang: string;
    metric: boolean;
    _links: SessionLinks;
    _embedded: SessionEmbedded;
}

interface SessionEmbedded {
    profile: Profile;
    device: Device;
}

interface Device {
    experiment_variations: ExperimentVariations;
    env: Env;
    ip: string;
    user_agent: UserAgent;
    accept_language: any[];
    _links: Links;
}

interface Env {
    KOMOOT_ENV: string;
    NODE_ENV: string;
    PORT: string;
}

interface ExperimentVariations {
    seo_guide_item_save_signin_style: string;
    seo_guide_sidebar_signup: string;
    seo_actions_menu_cta_style: string;
}

interface UserAgent {
    deviceType: string;
}

interface Profile {
    _links: ProfileLinks;
    _embedded: ProfileEmbedded;
}

interface ProfileEmbedded {
    config: Config;
    config_web: Weather;
}

interface Config {
    nps: Nps;
    feature_flags: any[];
    _links: Links;
    _meta: Meta;
}

interface Meta {
    nps_asked_once: boolean;
}

interface Nps {
    active: boolean;
    delay: number;
}

interface Weather {
    _links: Links;
}

interface ProfileLinks {
    config: Links;
    config_web: Links;
}

interface SessionLinks {
    self: SelfClass;
    profile: Links;
    device: Links;
}

interface SelfClass {
    href: string;
}

interface Page {
    gallery: boolean;
    profile: boolean;
    _screenshot: boolean;
    _links: PageLinks;
    _embedded: PageEmbedded;
}

interface PageEmbedded {
    tour: EmbeddedTour;
}

interface EmbeddedTour {
    status: string;
    sport: string;
    roundtrip: boolean;
    id: string;
    type: string;
    name: string;
    distance: number;
    duration: number;
    query: string;
    constitution: number;
    summary: Summary;
    difficulty: Difficulty;
    tour_information: any[];
    source: string;
    date: Date;
    changed_at: Date;
    kcal_active: number;
    kcal_resting: number;
    start_point: StartPoint;
    elevation_up: number;
    elevation_down: number;
    map_image: MapImage;
    map_image_preview: MapImage;
    _links: TourLinks;
    _embedded: TourEmbedded;
}

interface TourEmbedded {
    way_points: Nts;
    segments: Nts;
    weather: Weather;
    creator: Creator;
    coordinates: Coordinates;
    participants: Participants;
    way_types: Surfaces;
    surfaces: Surfaces;
    directions: Directions;
    timeline: Participants;
    cover_images: CoverImages;
    share_token: ShareToken;
    seo: SEO;
}

interface Coordinates {
    items: StartPoint[];
    _links: CoordinatesLinks;
}

interface CoordinatesLinks {
    self: SelfClass;
}

interface StartPoint {
    lat: number;
    lng: number;
    alt: number;
    t?: number;
}

interface CoverImages {
    _links: CoordinatesLinks;
    _embedded: CoverImagesEmbedded;
}

interface CoverImagesEmbedded {
    items: EmbeddedItem[];
}

interface EmbeddedItem {
    type: string;
    from?: number;
    to?: number;
    _links: ItemLinks;
    index?: number;
    cover?: null;
    _embedded?: ItemEmbedded;
}

interface ItemEmbedded {
    reference: Reference;
}

interface Reference {
    location: StartPoint;
    type: string;
    _links: CoordinatesLinks;
}

interface ItemLinks {
    reference?: SelfClass;
}

interface Creator {
    username: string;
    avatar: MapImage;
    status: string;
    display_name: string;
    _links: CreatorLinks;
}

interface CreatorLinks {
    self: SelfClass;
    relation: Relation;
}

interface Relation {
    href: string;
    templated: boolean;
}

interface MapImage {
    src: string;
    templated: boolean;
    type: string;
    attribution?: string;
}

interface Directions {
    items: DirectionsItem[];
    _links: CoordinatesLinks;
}

interface DirectionsItem {
    index: number;
    cardinal_direction: CardinalDirection;
    change_way: boolean;
    complex: boolean;
    distance: number;
    last_similar: number;
    street_name: string;
    type: string;
    way_type: WayType;
    roundabout?: Roundabout;
}

enum CardinalDirection {
    E = 'E',
    N = 'N',
    Ne = 'NE',
    Nw = 'NW',
    SE = 'SE',
    W = 'W',
}

interface Roundabout {
    total_exits: number;
    orientation: string;
    exits: number[];
    totalExits: number;
}

enum WayType {
    WtCycleway = 'wt#cycleway',
    WtMinorRoad = 'wt#minor_road',
    WtPrimary = 'wt#primary',
    WtStreet = 'wt#street',
    WtTrailD2 = 'wt#trail_d2',
    WtWay = 'wt#way',
}

interface Participants {
    _links: CoordinatesLinks;
    page: ParticipantsPage;
    _embedded: CoverImagesEmbedded;
}

interface ParticipantsPage {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
}

interface Nts {
    _links: Links;
    page: ParticipantsPage;
    _embedded: CoverImagesEmbedded;
}

interface SEO {
    poor_quality: boolean;
    _links: Links;
}

interface ShareToken {
    token: string;
    _links: CoordinatesLinks;
}

interface Surfaces {
    items: SurfacesItem[];
    _links: CoordinatesLinks;
}

interface SurfacesItem {
    from: number;
    to: number;
    element: string;
}

interface TourLinks {
    self: SelfClass;
    way_points: Links;
    segments: Links;
    weather: Links;
    creator: SelfClass;
    coordinates: SelfClass;
    participants: SelfClass;
    way_types: SelfClass;
    surfaces: SelfClass;
    directions: SelfClass;
    timeline: SelfClass;
    cover_images: SelfClass;
    share_token: SelfClass;
    elements: SelfClass;
    weather_forecast: SelfClass;
    seo: Links;
}

interface Difficulty {
    grade: string;
    explanation_technical: string;
    explanation_fitness: string;
}

interface Summary {
    surfaces: Surface[];
    way_types: Surface[];
}

interface Surface {
    type: string;
    amount: number;
}

interface PageLinks {
    tour: SelfClass;
}
