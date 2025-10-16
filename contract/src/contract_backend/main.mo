persistent actor MyCanister {

  public shared query func greeting() : async Text {
    return "Hello, Internet Computer!";
  };

  public shared({}) func greet() : async Text {
    return "Hello, Internet Computer!";
  };

}